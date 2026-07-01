"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Globe2, HardDrive, ImageIcon, ImagePlus, Layers, Pencil, Plus, Puzzle, Server, Trash2, X } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldLabel,
  Select,
  StatusBadge,
  TextArea,
  TextInput,
  cn,
} from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

const ADDON_SECTIONS = [
  {
    type: "region",
    label: "Regions",
    singular: "region",
    description: "One selectable deployment location. Customers pick one region during checkout.",
    icon: Globe2,
  },
  {
    type: "storage",
    label: "Storage",
    singular: "storage option",
    description: "One selectable disk profile with included capacity and per-unit pricing.",
    icon: HardDrive,
  },
  {
    type: "image",
    label: "Images",
    singular: "image option",
    description: "One selectable operating system, control panel, or licensed server image.",
    icon: ImageIcon,
  },
  {
    type: "feature",
    label: "Additional Features",
    singular: "feature",
    description: "Optional extras that customers can add alongside the required selections.",
    icon: Puzzle,
  },
];
const ADDON_TYPES = ADDON_SECTIONS.map((section) => section.type);
const SELECTION_MODES = ["multi", "single"];

function addonSectionFor(type) {
  return ADDON_SECTIONS.find((section) => section.type === type) || ADDON_SECTIONS.find((section) => section.type === "feature");
}

function defaultSelectionModeFor(type) {
  return type === "feature" ? "multi" : "single";
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function linesToArray(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function categoryIdOf(record) {
  return record?.categoryId?._id || record?.categoryId || "";
}

function addonPriceSummary(addon) {
  if (addon.addonType === "storage") {
    return `${formatCurrency(addon.pricePerUnitMonthly || 0)} / ${addon.unitLabel || "unit"} / mo`;
  }
  return `${formatCurrency(addon.monthlyPrice || 0)} / mo`;
}

function addonScopeLabel(addon) {
  const count = Array.isArray(addon.planIds) ? addon.planIds.length : 0;
  if (count === 0) return "All plans";
  if (count === 1) return "1 plan";
  return `${count} plans`;
}

function groupAddonsBySection(addons = []) {
  return ADDON_SECTIONS.reduce((groups, section) => {
    groups[section.type] = addons.filter((addon) => (addon.addonType || "feature") === section.type);
    return groups;
  }, {});
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { url } = await apiFetch("/admin/uploads/image", { method: "POST", authMode: "staff", isMultipart: true, body: formData });
  return url;
}

function AddonSectionPanel({ section, addons, onCreate, onEdit, onDelete }) {
  const Icon = section.icon;

  return (
    <section className="rounded-lg border border-line bg-slate-50/50">
      <div className="flex flex-col gap-3 border-b border-line px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-line">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{section.label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-line">
                {addons.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{section.description}</p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onCreate}>
          <Plus className="h-4 w-4" />New {section.singular}
        </Button>
      </div>

      <div className="space-y-2 p-3">
        {addons.map((addon) => (
          <div key={addon._id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-500">
              {addon.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={addon.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{addon.name}</p>
                <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">{addonScopeLabel(addon)}</span>
                {addon.optionCode ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">{addon.optionCode}</span>
                ) : null}
                {!addon.isActive ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">Inactive</span> : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{addonPriceSummary(addon)}</p>
            </div>
            <button type="button" onClick={() => onEdit(addon)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${addon.name}`}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onDelete(addon)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${addon.name}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!addons.length ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-4 text-sm font-medium text-slate-500">
            No {section.label.toLowerCase()} for this plan.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Modal({ title, description, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 sm:p-6">
      <Card className={cn("my-6 w-full", wide ? "max-w-2xl" : "max-w-lg")}>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function ImageField({ label, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const { showToast } = useActionToast();

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Upload failed", description: error.message });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-slate-300" />
          )}
        </div>
        <label className="cursor-pointer rounded-md border border-line bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={handleFile} disabled={busy} />
        </label>
        {value ? (
          <button type="button" onClick={() => onChange("")} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PlanEditorModal({ plan, categoryId, onClose, onSaved }) {
  const editing = Boolean(plan?._id);
  const [form, setForm] = useState({
    name: plan?.name || "",
    slug: plan?.slug || "",
    description: plan?.description || "",
    monthlyPrice: plan?.monthlyPrice ?? 0,
    yearlyPrice: plan?.yearlyPrice ?? 0,
    yearlyDiscountPercent: plan?.yearlyDiscountPercent ?? 0,
    features: (plan?.features || []).join("\n"),
    techStack: (plan?.techStack || []).join("\n"),
    imageUrl: plan?.imageUrl || "",
    isActive: plan?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useActionToast();

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const body = {
      categoryId,
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim(),
      monthlyPrice: Number(form.monthlyPrice) || 0,
      yearlyPrice: Number(form.yearlyPrice) || 0,
      yearlyDiscountPercent: Number(form.yearlyDiscountPercent) || 0,
      features: linesToArray(form.features),
      techStack: linesToArray(form.techStack),
      imageUrl: form.imageUrl,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/products/${plan._id}`, { method: "PATCH", authMode: "staff", body });
      } else {
        await apiFetch("/admin/products", { method: "POST", authMode: "staff", body });
      }
      showToast({ type: "success", action: "Catalog", title: editing ? "Plan updated" : "Plan created", description: body.name });
      onSaved();
      onClose();
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Save failed", description: error.message });
      setSaving(false);
    }
  }

  return (
    <Modal wide title={editing ? "Edit plan" : "New plan"} description="Plans appear under their category in the catalog and store." onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Plan name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="VPS-2GB" required />
          </div>
          <div>
            <FieldLabel>Slug</FieldLabel>
            <TextInput value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder="auto from name" />
          </div>
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel>Monthly price</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={form.monthlyPrice} onChange={(e) => update("monthlyPrice", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Yearly price</FieldLabel>
            <TextInput type="number" min="0" step="0.01" value={form.yearlyPrice} onChange={(e) => update("yearlyPrice", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Yearly discount %</FieldLabel>
            <TextInput type="number" min="0" max="100" value={form.yearlyDiscountPercent} onChange={(e) => update("yearlyDiscountPercent", e.target.value)} />
          </div>
        </div>
        <ImageField label="Plan image" value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Features (one per line)</FieldLabel>
            <TextArea value={form.features} onChange={(e) => update("features", e.target.value)} placeholder="2 GB RAM&#10;2 vCPU&#10;50 GB SSD" />
          </div>
          <div>
            <FieldLabel>Tech stack (one per line)</FieldLabel>
            <TextArea value={form.techStack} onChange={(e) => update("techStack", e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active (visible to customers)
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save plan" : "Create plan"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AddonEditorModal({ addon, categoryId, plansInCategory, defaultPlanId, defaultAddonType = "feature", onClose, onSaved }) {
  const editing = Boolean(addon?._id);
  const initialPlanIds = (addon?.planIds || []).map(String);
  const initialAddonType = addon?.addonType || defaultAddonType || "feature";
  const [form, setForm] = useState({
    name: addon?.name || "",
    optionCode: addon?.optionCode || "",
    description: addon?.description || "",
    addonType: initialAddonType,
    selectionMode: addon?.selectionMode || defaultSelectionModeFor(initialAddonType),
    monthlyPrice: addon?.monthlyPrice ?? 0,
    yearlyPrice: addon?.yearlyPrice ?? 0,
    includedQuantity: addon?.includedQuantity ?? 0,
    pricePerUnitMonthly: addon?.pricePerUnitMonthly ?? 0,
    pricePerUnitYearly: addon?.pricePerUnitYearly ?? 0,
    unitLabel: addon?.unitLabel || "GB",
    minQuantity: addon?.minQuantity ?? 0,
    maxQuantity: addon?.maxQuantity ?? 0,
    quantityStep: addon?.quantityStep ?? 1,
    imageUrl: addon?.imageUrl || "",
    isActive: addon?.isActive ?? true,
  });
  const [allPlans, setAllPlans] = useState(editing ? initialPlanIds.length === 0 : false);
  const [planIds, setPlanIds] = useState(editing ? initialPlanIds : defaultPlanId ? [String(defaultPlanId)] : []);
  const [saving, setSaving] = useState(false);
  const { showToast } = useActionToast();

  const isStorage = form.addonType === "storage";

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAddonType(value) {
    setForm((current) => ({
      ...current,
      addonType: value,
      selectionMode: defaultSelectionModeFor(value),
    }));
  }

  function togglePlan(id) {
    setPlanIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!allPlans && planIds.length === 0) {
      showToast({ type: "error", action: "Catalog", title: "Pick plans", description: "Assign at least one plan, or choose 'all plans'." });
      return;
    }
    setSaving(true);
    const body = {
      categoryId,
      name: form.name.trim(),
      slug: slugify(addon?.slug || form.name),
      optionCode: form.optionCode.trim(),
      description: form.description.trim(),
      addonType: form.addonType,
      selectionMode: form.selectionMode,
      monthlyPrice: Number(form.monthlyPrice) || 0,
      yearlyPrice: Number(form.yearlyPrice) || 0,
      includedQuantity: Number(form.includedQuantity) || 0,
      pricePerUnitMonthly: Number(form.pricePerUnitMonthly) || 0,
      pricePerUnitYearly: Number(form.pricePerUnitYearly) || 0,
      unitLabel: form.unitLabel,
      minQuantity: Number(form.minQuantity) || 0,
      maxQuantity: Number(form.maxQuantity) || 0,
      quantityStep: Number(form.quantityStep) || 1,
      imageUrl: form.imageUrl,
      isActive: form.isActive,
      planIds: allPlans ? [] : planIds,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/addons/${addon._id}`, { method: "PATCH", authMode: "staff", body });
      } else {
        await apiFetch("/admin/addons", { method: "POST", authMode: "staff", body });
      }
      showToast({ type: "success", action: "Catalog", title: editing ? "Add-on updated" : "Add-on created", description: body.name });
      onSaved();
      onClose();
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Save failed", description: error.message });
      setSaving(false);
    }
  }

  return (
    <Modal
      wide
      title={editing ? "Edit add-on" : `New ${addonSectionFor(form.addonType).singular}`}
      description="The section controls where this appears in checkout: regions, storage, images, or additional features."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Add-on name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Extra IP address" required />
          </div>
          <div>
            <FieldLabel>Checkout section</FieldLabel>
            <Select value={form.addonType} onChange={(e) => updateAddonType(e.target.value)}>
              {ADDON_TYPES.map((type) => (
                <option key={type} value={type}>{addonSectionFor(type).label}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <FieldLabel>Option code</FieldLabel>
          <TextInput value={form.optionCode} onChange={(e) => update("optionCode", e.target.value)} placeholder="feature-extra-ipv4, image-ubuntu, region-eu" />
          <p className="mt-1.5 text-xs leading-5 text-slate-500">
            Optional stable code used by checkout for known options and artwork. Leave blank for a normal add-on.
          </p>
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        {isStorage ? (
          <div className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Unit label</FieldLabel>
              <TextInput value={form.unitLabel} onChange={(e) => update("unitLabel", e.target.value)} placeholder="GB" />
            </div>
            <div>
              <FieldLabel>Price / unit / mo</FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={form.pricePerUnitMonthly} onChange={(e) => update("pricePerUnitMonthly", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Price / unit / yr</FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={form.pricePerUnitYearly} onChange={(e) => update("pricePerUnitYearly", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Included qty</FieldLabel>
              <TextInput type="number" min="0" value={form.includedQuantity} onChange={(e) => update("includedQuantity", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Min / Max</FieldLabel>
              <div className="flex gap-2">
                <TextInput type="number" min="0" value={form.minQuantity} onChange={(e) => update("minQuantity", e.target.value)} />
                <TextInput type="number" min="0" value={form.maxQuantity} onChange={(e) => update("maxQuantity", e.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel>Step</FieldLabel>
              <TextInput type="number" min="1" value={form.quantityStep} onChange={(e) => update("quantityStep", e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Monthly price</FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={form.monthlyPrice} onChange={(e) => update("monthlyPrice", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Yearly price</FieldLabel>
              <TextInput type="number" min="0" step="0.01" value={form.yearlyPrice} onChange={(e) => update("yearlyPrice", e.target.value)} />
            </div>
            <div>
              <FieldLabel>Selection</FieldLabel>
              <Select value={form.selectionMode} onChange={(e) => update("selectionMode", e.target.value)}>
                {SELECTION_MODES.map((mode) => (
                  <option key={mode} value={mode} className="capitalize">{mode}</option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <ImageField label={form.addonType === "image" ? "Option image (e.g. OS logo)" : "Add-on image (optional)"} value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />

        <div className="rounded-lg border border-line p-4">
          <FieldLabel>Availability</FieldLabel>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={allPlans} onChange={(e) => setAllPlans(e.target.checked)} />
            Available to all plans in this category
          </label>
          {!allPlans ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {plansInCategory.map((plan) => (
                <label key={plan._id} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-slate-700">
                  <input type="checkbox" checked={planIds.includes(String(plan._id))} onChange={() => togglePlan(String(plan._id))} />
                  {plan.name}
                </label>
              ))}
              {!plansInCategory.length ? <p className="text-sm text-slate-500">Create a plan first to assign this add-on.</p> : null}
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} />
          Active (offered at checkout)
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save add-on" : "Create add-on"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryEditorModal({ category, onClose, onSaved }) {
  const editing = Boolean(category?._id);
  const [form, setForm] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    imageUrl: category?.imageUrl || "",
    isActive: category?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useActionToast();

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim(),
      imageUrl: form.imageUrl,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiFetch(`/admin/categories/${category._id}`, { method: "PATCH", authMode: "staff", body });
      } else {
        await apiFetch("/admin/categories", { method: "POST", authMode: "staff", body });
      }
      showToast({ type: "success", action: "Catalog", title: editing ? "Category updated" : "Category created", description: body.name });
      onSaved();
      onClose();
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Save failed", description: error.message });
      setSaving(false);
    }
  }

  return (
    <Modal title={editing ? "Edit category" : "New category"} description="Categories group your plans (e.g. VPS, VDS, AI servers)." onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Name</FieldLabel>
            <TextInput value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="VPS" required />
          </div>
          <div>
            <FieldLabel>Slug</FieldLabel>
            <TextInput value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} placeholder="auto from name" />
          </div>
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
        </div>
        <ImageField label="Category image" value={form.imageUrl} onChange={(url) => setForm((c) => ({ ...c, imageUrl: url }))} />
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} />
          Active
        </label>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminCatalogPage() {
  const { data, isLoading, refetch } = useStaffQuery({ queryKey: ["admin-products"], path: "/admin/products" });
  const { showToast } = useActionToast();

  const categories = useMemo(() => data?.categories || [], [data]);
  const plans = useMemo(() => data?.plans || [], [data]);
  const addons = useMemo(() => data?.addons || [], [data]);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [expandedPlanId, setExpandedPlanId] = useState("");
  const [modal, setModal] = useState(null); // { type, ... }

  const activeCategoryId = selectedCategoryId || categories[0]?._id || "";
  const activeCategory = categories.find((c) => c._id === activeCategoryId) || null;
  const plansInCategory = plans.filter((p) => categoryIdOf(p) === activeCategoryId);
  const addonsInCategory = addons.filter((a) => categoryIdOf(a) === activeCategoryId);

  function addonsForPlan(planId) {
    return addonsInCategory.filter((a) => {
      const ids = (a.planIds || []).map(String);
      return ids.length === 0 || ids.includes(String(planId));
    });
  }

  async function deletePlan(plan) {
    if (!window.confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/products/${plan._id}`, { method: "DELETE", authMode: "staff" });
      await refetch();
      showToast({ type: "success", action: "Catalog", title: "Plan deleted", description: plan.name });
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Delete failed", description: error.message });
    }
  }

  async function deleteAddon(addon) {
    if (!window.confirm(`Delete add-on "${addon.name}"?`)) return;
    try {
      await apiFetch(`/admin/addons/${addon._id}`, { method: "DELETE", authMode: "staff" });
      await refetch();
      showToast({ type: "success", action: "Catalog", title: "Add-on deleted", description: addon.name });
    } catch (error) {
      showToast({ type: "error", action: "Catalog", title: "Delete failed", description: error.message });
    }
  }

  if (isLoading && !data) {
    return <PageLoader title="Loading catalog" subtitle="Gathering categories, plans, and add-ons…" />;
  }

  return (
    <div>
      <Topbar
        title="Catalog"
        subtitle="Manage categories, their plans, and the add-ons & pricing for each plan — all in one place."
        actions={<Button onClick={() => setModal({ type: "category" })}><Plus className="h-4 w-4" />New category</Button>}
      />
      <div className="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* Categories */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>{categories.length} total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {categories.map((category) => {
                const count = plans.filter((p) => categoryIdOf(p) === category._id).length;
                const active = category._id === activeCategoryId;
                return (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category._id);
                      setExpandedPlanId("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      active ? "border-brand-200 bg-brand-50" : "border-line bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md", active ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500")}>
                        {category.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Layers className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-semibold", active ? "text-brand-700" : "text-slate-900")}>{category.name}</span>
                        <span className="block text-xs text-slate-400">{count} plan{count === 1 ? "" : "s"}</span>
                      </span>
                    </span>
                    <Pencil
                      className="h-3.5 w-3.5 shrink-0 text-slate-300 hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "category", category });
                      }}
                    />
                  </button>
                );
              })}
              {!categories.length ? <p className="text-sm text-slate-500">No categories yet.</p> : null}
            </CardContent>
          </Card>

          {/* Plans + add-ons */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.01em] text-slate-900">{activeCategory?.name || "Plans"}</h2>
                <p className="text-sm text-slate-500">{plansInCategory.length} plan{plansInCategory.length === 1 ? "" : "s"} in this category</p>
              </div>
              {activeCategory ? (
                <Button onClick={() => setModal({ type: "plan", categoryId: activeCategoryId })}>
                  <Plus className="h-4 w-4" />New plan
                </Button>
              ) : null}
            </div>

            {plansInCategory.map((plan) => {
              const expanded = expandedPlanId === plan._id;
              const planAddons = addonsForPlan(plan._id);
              const addonsBySection = groupAddonsBySection(planAddons);
              return (
                <Card key={plan._id}>
                  <button
                    type="button"
                    onClick={() => setExpandedPlanId(expanded ? "" : plan._id)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                      {plan.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={plan.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Server className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{plan.name}</p>
                        <StatusBadge status={plan.isActive ? "active" : "draft"} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatCurrency(plan.monthlyPrice)}/mo · {formatCurrency(plan.yearlyPrice)}/yr · {planAddons.length} add-on{planAddons.length === 1 ? "" : "s"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ADDON_SECTIONS.map((section) => {
                          const count = addonsBySection[section.type]?.length || 0;
                          return (
                            <span key={section.type} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                              {section.label}: {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", expanded && "rotate-180")} />
                  </button>

                  {expanded ? (
                    <div className="border-t border-line p-4">
                      <div className="mb-4 flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setModal({ type: "plan", categoryId: activeCategoryId, plan })}>
                          <Pencil className="h-4 w-4" />Edit plan
                        </Button>
                        <Button variant="destructive" onClick={() => deletePlan(plan)}>
                          <Trash2 className="h-4 w-4" />Delete plan
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {ADDON_SECTIONS.map((section) => (
                          <AddonSectionPanel
                            key={section.type}
                            section={section}
                            addons={addonsBySection[section.type] || []}
                            onCreate={() =>
                              setModal({
                                type: "addon",
                                categoryId: activeCategoryId,
                                defaultPlanId: plan._id,
                                defaultAddonType: section.type,
                              })
                            }
                            onEdit={(addon) => setModal({ type: "addon", categoryId: activeCategoryId, addon })}
                            onDelete={deleteAddon}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}

            {activeCategory && !plansInCategory.length ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-600">No plans in {activeCategory.name} yet.</p>
                  <Button className="mt-4" onClick={() => setModal({ type: "plan", categoryId: activeCategoryId })}>
                    <Plus className="h-4 w-4" />Create the first plan
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {!activeCategory ? (
              <Card>
                <CardContent className="p-8 text-center text-sm text-slate-500">Create a category to start building your catalog.</CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {modal?.type === "category" ? (
        <CategoryEditorModal category={modal.category} onClose={() => setModal(null)} onSaved={refetch} />
      ) : null}
      {modal?.type === "plan" ? (
        <PlanEditorModal plan={modal.plan} categoryId={modal.categoryId} onClose={() => setModal(null)} onSaved={refetch} />
      ) : null}
      {modal?.type === "addon" ? (
        <AddonEditorModal
          addon={modal.addon}
          categoryId={modal.categoryId}
          plansInCategory={plansInCategory}
          defaultPlanId={modal.defaultPlanId}
          defaultAddonType={modal.defaultAddonType}
          onClose={() => setModal(null)}
          onSaved={refetch}
        />
      ) : null}
    </div>
  );
}
