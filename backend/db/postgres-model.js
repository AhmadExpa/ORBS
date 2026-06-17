import crypto from "crypto";
import { query, withTransaction } from "./postgres-client.js";

const registry = new Map();
const operatorKeys = new Set(["$in", "$lte", "$gte", "$lt", "$gt", "$ne"]);

function normalizeId(value) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function hasOperators(value) {
  return isPlainObject(value) && Object.keys(value).some((key) => operatorKeys.has(key));
}

function toStorageValue(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toStorageValue(item))
      .filter((item) => item !== undefined);
  }

  if (isPlainObject(value)) {
    if (value._id && Object.keys(value).length <= 3) {
      return normalizeId(value._id);
    }

    return Object.fromEntries(
      Object.entries(value)
        .map(([key, nestedValue]) => [key, toStorageValue(nestedValue)])
        .filter(([, nestedValue]) => nestedValue !== undefined),
    );
  }

  return value;
}

function applyDefaults(data, defaults = {}) {
  const resolved = { ...data };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (resolved[key] === undefined) {
      resolved[key] = typeof defaultValue === "function" ? defaultValue() : structuredClone(defaultValue);
    }
  }

  return resolved;
}

function fromStorageValue(value, field, config) {
  if (value === undefined || value === null) {
    return value;
  }

  if (config.dateFields?.includes(field)) {
    return new Date(value);
  }

  return value;
}

function makeDocument(model, row, { lean = false, selectedFields = null } = {}) {
  if (!row) {
    return null;
  }

  const stored = row.data || {};
  let data = {
    _id: row.id,
    ...Object.fromEntries(
      Object.entries(stored).map(([key, value]) => [key, fromStorageValue(value, key, model.config)]),
    ),
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  };

  if (selectedFields) {
    data = Object.fromEntries(
      Object.entries(data).filter(([key]) => key === "_id" || selectedFields.has(key)),
    );
  }

  if (lean) {
    Object.defineProperty(data, "__model", {
      value: model,
      enumerable: false,
      configurable: false,
    });
    return data;
  }

  const document = Object.assign(Object.create(model.documentPrototype), data);
  Object.defineProperty(document, "__model", {
    value: model,
    enumerable: false,
    configurable: false,
  });
  return document;
}

function extractDocumentData(document) {
  return Object.fromEntries(
    Object.entries(document)
      .filter(([key]) => !["_id", "createdAt", "updatedAt"].includes(key))
      .map(([key, value]) => [key, toStorageValue(value)])
      .filter(([, value]) => value !== undefined),
  );
}

function castExpression(field, model) {
  if (field === "createdAt") {
    return "created_at";
  }

  if (field === "updatedAt") {
    return "updated_at";
  }

  if (model.config.numericFields?.includes(field)) {
    return `NULLIF(data->>$FIELD$, '')::numeric`.replace("$FIELD$", `'${field}'`);
  }

  if (model.config.booleanFields?.includes(field)) {
    return `NULLIF(data->>$FIELD$, '')::boolean`.replace("$FIELD$", `'${field}'`);
  }

  if (model.config.dateFields?.includes(field)) {
    return `NULLIF(data->>$FIELD$, '')::timestamptz`.replace("$FIELD$", `'${field}'`);
  }

  return `data->>'${field}'`;
}

class SqlBuilder {
  constructor(model) {
    this.model = model;
    this.params = [];
  }

  addParam(value) {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  fieldComparison(field, operator, rawValue) {
    const value = toStorageValue(rawValue);

    if (field === "_id") {
      if (operator === "$in") {
        return `id = ANY(${this.addParam(value.map(normalizeId))}::text[])`;
      }

      return `id ${operator === "$ne" ? "<>" : "="} ${this.addParam(normalizeId(value))}`;
    }

    if (operator === "$in") {
      const values = value.map((item) => String(toStorageValue(item)));
      return `${castExpression(field, this.model)} = ANY(${this.addParam(values)}::text[])`;
    }

    const expression = castExpression(field, this.model);

    if (operator === "$lte") {
      return `${expression} <= ${this.addParam(value)}`;
    }

    if (operator === "$gte") {
      return `${expression} >= ${this.addParam(value)}`;
    }

    if (operator === "$lt") {
      return `${expression} < ${this.addParam(value)}`;
    }

    if (operator === "$gt") {
      return `${expression} > ${this.addParam(value)}`;
    }

    if (operator === "$ne") {
      return `${expression} <> ${this.addParam(String(value))}`;
    }

    if (value === null) {
      return `(NOT (data ? ${this.addParam(field)}) OR data->${this.addParam(field)} IS NULL)`;
    }

    if (this.model.config.arrayFields?.includes(field)) {
      return `(data->${this.addParam(field)} @> ${this.addParam(JSON.stringify([value]))}::jsonb)`;
    }

    if (typeof value === "boolean") {
      return `${expression} = ${this.addParam(value)}`;
    }

    if (typeof value === "number") {
      return `${expression} = ${this.addParam(value)}`;
    }

    if (this.model.config.dateFields?.includes(field) && value) {
      return `${expression} = ${this.addParam(value)}`;
    }

    return `${expression} = ${this.addParam(String(value))}`;
  }

  buildFilter(filter = {}) {
    const clauses = [`collection = ${this.addParam(this.model.collection)}`];

    for (const [field, value] of Object.entries(filter || {})) {
      if (field === "$or" && Array.isArray(value)) {
        const nested = value.map((item) => {
          const nestedBuilder = new SqlBuilder(this.model);
          const nestedWhere = nestedBuilder.buildFilterWithoutCollection(item);
          const offsetClauses = nestedWhere.sql.replace(/\$(\d+)/g, (_, number) => {
            const paramValue = nestedBuilder.params[Number(number) - 1];
            return this.addParam(paramValue);
          });
          return `(${offsetClauses})`;
        });

        if (nested.length) {
          clauses.push(`(${nested.join(" OR ")})`);
        }
        continue;
      }

      if (hasOperators(value)) {
        for (const [operator, operatorValue] of Object.entries(value)) {
          clauses.push(this.fieldComparison(field, operator, operatorValue));
        }
        continue;
      }

      clauses.push(this.fieldComparison(field, "$eq", value));
    }

    return {
      sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
      params: this.params,
    };
  }

  buildFilterWithoutCollection(filter = {}) {
    const clauses = [];

    for (const [field, value] of Object.entries(filter || {})) {
      if (hasOperators(value)) {
        for (const [operator, operatorValue] of Object.entries(value)) {
          clauses.push(this.fieldComparison(field, operator, operatorValue));
        }
        continue;
      }

      clauses.push(this.fieldComparison(field, "$eq", value));
    }

    return {
      sql: clauses.length ? clauses.join(" AND ") : "TRUE",
      params: this.params,
    };
  }
}

function buildOrderBy(model, sortSpec) {
  if (!sortSpec || !Object.keys(sortSpec).length) {
    return "";
  }

  const fields = Object.entries(sortSpec).map(([field, direction]) => {
    const sqlDirection = Number(direction) < 0 ? "DESC" : "ASC";
    return `${castExpression(field, model)} ${sqlDirection} NULLS LAST`;
  });

  return `ORDER BY ${fields.join(", ")}`;
}

class PostgresQuery {
  constructor(model, { filter = {}, single = false, byId = null } = {}) {
    this.model = model;
    this.filter = byId ? { _id: byId } : filter;
    this.single = single || Boolean(byId);
    this.populateSpecs = [];
    this.sortSpec = null;
    this.limitCount = null;
    this.leanMode = false;
    this.selectedFields = null;
  }

  populate(spec) {
    if (Array.isArray(spec)) {
      this.populateSpecs.push(...spec);
    } else {
      this.populateSpecs.push(spec);
    }
    return this;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  limit(count) {
    this.limitCount = Number(count);
    return this;
  }

  lean() {
    this.leanMode = true;
    return this;
  }

  select(fields) {
    if (typeof fields === "string") {
      this.selectedFields = new Set(fields.split(/\s+/).filter(Boolean));
    }
    return this;
  }

  async exec() {
    const builder = new SqlBuilder(this.model);
    const where = builder.buildFilter(this.filter);
    const orderBy = buildOrderBy(this.model, this.sortSpec);
    const limit = this.single ? "LIMIT 1" : this.limitCount ? `LIMIT ${this.limitCount}` : "";
    const result = await query(
      `
        SELECT id, data, created_at, updated_at
        FROM eo_documents
        ${where.sql}
        ${orderBy}
        ${limit}
      `,
      where.params,
    );

    const rows = result.rows.map((row) =>
      makeDocument(this.model, row, {
        lean: this.leanMode,
        selectedFields: this.selectedFields,
      }),
    );

    await populateDocuments(rows, this.populateSpecs);

    if (this.single) {
      return rows[0] || null;
    }

    return rows;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

async function populateDocuments(documents, specs) {
  if (!specs.length) {
    return documents;
  }

  const docs = Array.isArray(documents) ? documents : [documents];

  for (const spec of specs.flatMap(normalizePopulateSpec)) {
    await populatePath(docs.filter(Boolean), spec);
  }

  return documents;
}

function normalizePopulateSpec(spec) {
  if (!spec) {
    return [];
  }

  if (typeof spec === "string") {
    return spec.split(/\s+/).filter(Boolean).map((path) => ({ path }));
  }

  return [spec];
}

async function populatePath(documents, spec) {
  const path = spec.path;
  if (!path || !documents.length) {
    return;
  }

  const owningModel = documents[0]?.__model || registry.get(documents[0]?.__collection);
  const refName = owningModel?.config.refs?.[path];
  const refModel = registry.get(refName);
  if (!refModel) {
    return;
  }

  const ids = [
    ...new Set(
      documents
        .flatMap((document) => {
          const value = document?.[path];
          return Array.isArray(value) ? value.map(normalizeId) : [normalizeId(value)];
        })
        .filter(Boolean),
    ),
  ];

  if (!ids.length) {
    return;
  }

  const relatedDocs = await refModel.find({ _id: { $in: ids } }).exec();
  const relatedById = new Map(relatedDocs.map((document) => [String(document._id), document]));

  for (const document of documents) {
    const currentValue = document[path];
    if (Array.isArray(currentValue)) {
      document[path] = currentValue.map((id) => relatedById.get(String(normalizeId(id)))).filter(Boolean);
    } else if (currentValue) {
      document[path] = relatedById.get(String(normalizeId(currentValue))) || currentValue;
    }
  }

  if (spec.populate) {
    const populatedValues = documents.flatMap((document) => {
      const value = document[path];
      return Array.isArray(value) ? value : [value];
    });
    await populateDocuments(populatedValues.filter((value) => value && typeof value === "object"), [spec.populate]);
  }
}

function normalizeUpdate(update = {}) {
  const hasOperator = Object.keys(update).some((key) => key.startsWith("$"));

  if (!hasOperator) {
    return {
      set: update,
      inc: {},
    };
  }

  return {
    set: update.$set || {},
    inc: update.$inc || {},
  };
}

function applyUpdateData(currentData, update) {
  const normalized = normalizeUpdate(update);
  const nextData = { ...currentData };

  for (const [key, value] of Object.entries(normalized.set)) {
    const storageValue = toStorageValue(value);
    if (storageValue !== undefined) {
      nextData[key] = storageValue;
    }
  }

  for (const [key, amount] of Object.entries(normalized.inc)) {
    nextData[key] = Number(nextData[key] || 0) + Number(amount || 0);
  }

  return nextData;
}

async function insertDocument(model, data) {
  const id = normalizeId(data._id || crypto.randomUUID());
  const now = new Date();
  const storedData = toStorageValue(applyDefaults(data, model.config.defaults));
  delete storedData._id;
  delete storedData.createdAt;
  delete storedData.updatedAt;

  await query(
    `
      INSERT INTO eo_documents (collection, id, data, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, $4, $5)
    `,
    [model.collection, id, JSON.stringify(storedData), now, now],
  );

  return model.findById(id).exec();
}

async function updateDocument(model, id, data) {
  const now = new Date();
  await query(
    `
      UPDATE eo_documents
      SET data = $3::jsonb, updated_at = $4
      WHERE collection = $1 AND id = $2
    `,
    [model.collection, normalizeId(id), JSON.stringify(toStorageValue(data)), now],
  );

  return model.findById(id).exec();
}

export function createPostgresModel(name, config) {
  class Model {
    static modelName = name;
    static collection = config.collection;
    static config = config;
    static documentPrototype = {
      async save() {
        return updateDocument(Model, this._id, extractDocumentData(this));
      },
      toJSON() {
        return Object.fromEntries(Object.entries(this));
      },
    };

    static create(data) {
      if (Array.isArray(data)) {
        return Promise.all(data.map((item) => insertDocument(Model, item)));
      }

      return insertDocument(Model, data);
    }

    static find(filter = {}) {
      return new PostgresQuery(Model, { filter });
    }

    static findOne(filter = {}) {
      return new PostgresQuery(Model, { filter, single: true });
    }

    static findById(id) {
      return new PostgresQuery(Model, { byId: id });
    }

    static async countDocuments(filter = {}) {
      const builder = new SqlBuilder(Model);
      const where = builder.buildFilter(filter);
      const result = await query(
        `
          SELECT count(*)::int AS count
          FROM eo_documents
          ${where.sql}
        `,
        where.params,
      );
      return Number(result.rows[0]?.count || 0);
    }

    static async findByIdAndUpdate(id, update, options = {}) {
      return Model.findOneAndUpdate({ _id: id }, update, options);
    }

    static async findOneAndUpdate(filter, update, options = {}) {
      return withTransaction(async () => {
        const builder = new SqlBuilder(Model);
        const where = builder.buildFilter(filter);
        const result = await query(
          `
            SELECT id, data, created_at, updated_at
            FROM eo_documents
            ${where.sql}
            LIMIT 1
            FOR UPDATE
          `,
          where.params,
        );

        const row = result.rows[0];
        if (!row) {
          if (!options.upsert) {
            return null;
          }

          const created = await insertDocument(Model, {
            ...filter,
            ...normalizeUpdate(update).set,
          });
          return options.new ? created : null;
        }

        const updatedData = applyUpdateData(row.data || {}, update);
        const updated = await updateDocument(Model, row.id, updatedData);
        return options.new === false ? makeDocument(Model, row) : updated;
      });
    }
  }

  registry.set(name, Model);
  registry.set(config.collection, Model);
  return Model;
}

export { withTransaction };
