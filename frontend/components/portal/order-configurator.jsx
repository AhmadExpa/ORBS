"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Globe2,
  HardDrive,
  ImageIcon,
  PlusCircle,
  Server,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TextArea,
  TextInput,
  cn,
} from "@/lib/ui";
import {
  calculatePlanPrice,
  calculateStoragePrice,
  formatCurrency,
  getAddonPrice,
  getAddonUnitPrice,
  getStorageMinimumQuantity,
} from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { apiFetch } from "@/lib/api/client";

function getBillingSuffix(billingCycle) {
  return billingCycle === "yearly" ? "/year" : "/month";
}

function formatAddonCharge(amount, billingCycle) {
  return amount > 0 ? `${formatCurrency(amount)}${getBillingSuffix(billingCycle)}` : "Included";
}

function normalizeStorageQuantity(value, storageAddon) {
  if (!storageAddon) {
    return "";
  }

  const minimumQuantity = getStorageMinimumQuantity(storageAddon);
  const quantityStep = Math.max(Number(storageAddon.quantityStep || 1), 1);
  const maximumQuantity = Number(storageAddon.maxQuantity || 0);
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return String(minimumQuantity);
  }

  let normalizedQuantity = Math.max(parsedValue, minimumQuantity);
  normalizedQuantity = minimumQuantity + Math.round((normalizedQuantity - minimumQuantity) / quantityStep) * quantityStep;

  if (maximumQuantity > 0) {
    normalizedQuantity = Math.min(normalizedQuantity, maximumQuantity);
  }

  return String(normalizedQuantity);
}

function OptionCard({ icon: Icon, title, description, priceLabel, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-3xl border p-5 text-left transition duration-200",
        selected
          ? "border-sky-300 bg-sky-50 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.9)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 rounded-2xl p-2.5",
              selected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600",
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-950">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-600" /> : null}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-900">{priceLabel}</span>
        {children}
      </div>
    </button>
  );
}

function SummaryRow({ label, value, emphasized = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={cn("text-right text-sm font-medium text-slate-900", emphasized && "text-base font-semibold")}>
        {value}
      </span>
    </div>
  );
}

function buildPricingItems({ plan, billingCycle, selectedRegion, selectedStorage, normalizedStorageQuantity, selectedImage, selectedFeatures }) {
  if (!plan) {
    return [];
  }

  const items = [
    {
      label: plan.name,
      amount: calculatePlanPrice(plan, billingCycle),
    },
  ];

  if (selectedRegion) {
    items.push({
      label: `Region: ${selectedRegion.name}`,
      amount: getAddonPrice(selectedRegion, billingCycle),
    });
  }

  if (selectedStorage) {
    items.push({
      label: `Storage: ${normalizedStorageQuantity} ${selectedStorage.unitLabel || "GB"} ${selectedStorage.name}`,
      amount: calculateStoragePrice(selectedStorage, billingCycle, normalizedStorageQuantity),
    });
  }

  if (selectedImage) {
    items.push({
      label: `Image: ${selectedImage.name}`,
      amount: getAddonPrice(selectedImage, billingCycle),
    });
  }

  selectedFeatures.forEach((addon) => {
    items.push({
      label: addon.name,
      amount: getAddonPrice(addon, billingCycle),
    });
  });

  return items;
}

export function OrderConfigurator({ slug }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [storageQuantity, setStorageQuantity] = useState("");
  const [finalNote, setFinalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-plan", slug],
    queryFn: () => apiFetch(`/catalog/plans/${slug}`),
  });

  const plan = data?.plan;
  const addonsQuery = useQuery({
    queryKey: ["catalog-addons", plan?.categoryId?.slug],
    queryFn: () => apiFetch(`/catalog/addons?category=${plan.categoryId.slug}`),
    enabled: Boolean(plan?.categoryId?.slug),
  });

  const addons = addonsQuery.data?.addons || [];
  const groupedAddons = useMemo(() => {
    const groups = {
      feature: [],
      region: [],
      storage: [],
      image: [],
    };

    addons.forEach((addon) => {
      const type = addon.addonType || "feature";
      if (!groups[type]) {
        groups.feature.push(addon);
        return;
      }

      groups[type].push(addon);
    });

    return groups;
  }, [addons]);

  const featureAddons = groupedAddons.feature;
  const extraIpAddon = featureAddons.find((addon) => addon.optionCode === "feature-extra-ipv4") || null;
  const otherFeatureAddons = featureAddons.filter((addon) => addon._id !== extraIpAddon?._id);
  const activeFeatureIds = useMemo(() => {
    const validAddonIds = new Set(featureAddons.map((addon) => addon._id));
    return selectedAddonIds.filter((addonId) => validAddonIds.has(addonId));
  }, [featureAddons, selectedAddonIds]);

  const regionOptions = groupedAddons.region;
  const imageOptions = groupedAddons.image;
  const storageOptions = groupedAddons.storage;

  const activeRegionId =
    selectedRegionId && regionOptions.some((addon) => addon._id === selectedRegionId)
      ? selectedRegionId
      : regionOptions[0]?._id || "";
  const activeImageId =
    selectedImageId && imageOptions.some((addon) => addon._id === selectedImageId)
      ? selectedImageId
      : imageOptions[0]?._id || "";
  const activeStorageId =
    selectedStorageId && storageOptions.some((addon) => addon._id === selectedStorageId)
      ? selectedStorageId
      : storageOptions[0]?._id || "";

  const selectedRegion = regionOptions.find((addon) => addon._id === activeRegionId) || null;
  const selectedImage = imageOptions.find((addon) => addon._id === activeImageId) || null;
  const selectedStorage = storageOptions.find((addon) => addon._id === activeStorageId) || null;
  const selectedFeatures = featureAddons.filter((addon) => activeFeatureIds.includes(addon._id));

  const minimumStorageQuantity = selectedStorage ? getStorageMinimumQuantity(selectedStorage) : 0;
  const storageQuantityInput = selectedStorage
    ? storageQuantity === ""
      ? String(minimumStorageQuantity)
      : storageQuantity
    : "";
  const normalizedStorageQuantity = selectedStorage
    ? Number(normalizeStorageQuantity(storageQuantityInput, selectedStorage))
    : 0;

  const summaryItems = useMemo(() => {
    return buildPricingItems({
      plan,
      billingCycle,
      selectedRegion,
      selectedStorage,
      normalizedStorageQuantity,
      selectedImage,
      selectedFeatures,
    });
  }, [billingCycle, normalizedStorageQuantity, plan, selectedFeatures, selectedImage, selectedRegion, selectedStorage]);
  const monthlySummaryItems = useMemo(
    () =>
      buildPricingItems({
        plan,
        billingCycle: "monthly",
        selectedRegion,
        selectedStorage,
        normalizedStorageQuantity,
        selectedImage,
        selectedFeatures,
      }),
    [normalizedStorageQuantity, plan, selectedFeatures, selectedImage, selectedRegion, selectedStorage],
  );

  const total = useMemo(
    () => summaryItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [summaryItems],
  );
  const monthlyTotal = useMemo(
    () => monthlySummaryItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [monthlySummaryItems],
  );

  function updateFeatureSelection(addonId, enabled) {
    setSelectedAddonIds((current) => {
      const withoutAddon = current.filter((item) => item !== addonId);
      return enabled ? [...withoutAddon, addonId] : withoutAddon;
    });
  }

  function handleStorageSelection(addon) {
    setSelectedStorageId(addon._id);

    const currentQuantity = Number(storageQuantityInput);
    const minimumQuantity = getStorageMinimumQuantity(addon);
    if (!Number.isFinite(currentQuantity) || currentQuantity < minimumQuantity) {
      setStorageQuantity(String(minimumQuantity));
    }
  }

  async function handleCreateOrder() {
    if (!plan || plan.contactSalesOnly) {
      router.push("/#contact");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = await getToken();
      const data = await apiFetch("/orders", {
        method: "POST",
        token,
        body: {
          productPlanId: plan._id,
          addonIds: activeFeatureIds,
          billingCycle,
          selectedRegionId: activeRegionId || undefined,
          selectedImageId: activeImageId || undefined,
          selectedStorageId: activeStorageId || undefined,
          storageQuantity: normalizedStorageQuantity || undefined,
          finalNote: finalNote.trim() || undefined,
        },
      });
      router.push(`/portal/checkout/${data.order._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!plan) {
    return (
      <div>
        <Topbar title="Order Configuration" subtitle={isLoading ? "Loading plan details..." : "Plan not found."} />
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title={`Configure ${plan.name}`}
        subtitle="Treat the homepage as the storefront, then use this flow to choose managed server options, deployment details, and optional add-ons before checkout."
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Order Flow</CardTitle>
            <CardDescription>
              Choose billing, deployment preferences, and additional managed features. ElevenOrbits will operate the server and its ongoing maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              {["monthly", "yearly"]
                .filter((cycle) => plan.billingCycles.includes(cycle))
                .map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={cn(
                      "rounded-3xl border p-5 text-left transition duration-200",
                      billingCycle === cycle
                        ? "border-sky-300 bg-sky-50 shadow-[0_20px_60px_-40px_rgba(14,165,233,0.9)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <p className="font-semibold capitalize text-slate-950">{cycle}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {cycle === "yearly" ? "Automatic yearly pricing where configured." : "Standard monthly billing."}
                    </p>
                  </button>
                ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-white p-2.5 text-slate-700 shadow-sm">
                  <Server className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Included</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                    {plan.features.map((feature) => (
                      <p key={feature}>• {feature}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {plan.techStack?.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Managed Tech Stack</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {plan.techStack.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {regionOptions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Region</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Choose the region where you want ElevenOrbits to provision this managed server.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {regionOptions.map((addon) => (
                    <OptionCard
                      key={addon._id}
                      icon={Globe2}
                      title={addon.name}
                      description={addon.description}
                      priceLabel={formatAddonCharge(getAddonPrice(addon, billingCycle), billingCycle)}
                      selected={addon._id === activeRegionId}
                      onClick={() => setSelectedRegionId(addon._id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {storageOptions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <HardDrive className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Storage</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Select the storage type, then set how much total disk you want provisioned on the server.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {storageOptions.map((addon) => (
                    <OptionCard
                      key={addon._id}
                      icon={HardDrive}
                      title={addon.name}
                      description={`Includes ${getStorageMinimumQuantity(addon)} ${addon.unitLabel || "GB"} and then ${formatCurrency(
                        getAddonUnitPrice(addon, billingCycle),
                      )} per ${addon.unitLabel || "GB"}${getBillingSuffix(billingCycle)}.`}
                      priceLabel={formatAddonCharge(getAddonPrice(addon, billingCycle), billingCycle)}
                      selected={addon._id === activeStorageId}
                      onClick={() => handleStorageSelection(addon)}
                    />
                  ))}
                </div>

                {selectedStorage ? (
                  <div className="mt-5 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div>
                      <p className="font-semibold text-slate-950">Storage Amount</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedStorage.name} includes {getStorageMinimumQuantity(selectedStorage)}{" "}
                        {selectedStorage.unitLabel || "GB"}. Additional capacity is billed at{" "}
                        {formatCurrency(getAddonUnitPrice(selectedStorage, billingCycle))} per{" "}
                        {selectedStorage.unitLabel || "GB"}
                        {getBillingSuffix(billingCycle)} in {Math.max(Number(selectedStorage.quantityStep || 1), 1)}{" "}
                        {selectedStorage.unitLabel || "GB"} steps.
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        Current storage charge:{" "}
                        {formatAddonCharge(
                          calculateStoragePrice(selectedStorage, billingCycle, normalizedStorageQuantity),
                          billingCycle,
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Total storage</label>
                      <TextInput
                        type="number"
                        min={minimumStorageQuantity}
                        max={selectedStorage.maxQuantity > 0 ? selectedStorage.maxQuantity : undefined}
                        step={Math.max(Number(selectedStorage.quantityStep || 1), 1)}
                        value={storageQuantityInput}
                        onChange={(event) => setStorageQuantity(event.target.value)}
                        onBlur={() => setStorageQuantity(normalizeStorageQuantity(storageQuantityInput, selectedStorage))}
                      />
                      <p className="mt-2 text-xs text-slate-500">Enter the total amount to provision, not just the extra amount.</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {imageOptions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Image</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Pick the operating system or licensed image you want provisioned on the server.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 xl:grid-cols-2">
                  {imageOptions.map((addon) => (
                    <OptionCard
                      key={addon._id}
                      icon={ImageIcon}
                      title={addon.name}
                      description={addon.description}
                      priceLabel={formatAddonCharge(getAddonPrice(addon, billingCycle), billingCycle)}
                      selected={addon._id === activeImageId}
                      onClick={() => setSelectedImageId(addon._id)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {extraIpAddon || otherFeatureAddons.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <PlusCircle className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Additional Features</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Optional managed extras for this order. Select only what you want added to the recurring bill.
                    </p>
                  </div>
                </div>

                {extraIpAddon ? (
                  <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">Extra IPv4 Address</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Do you want one additional public IPv4 address on this server?
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAddonCharge(getAddonPrice(extraIpAddon, billingCycle), billingCycle)}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => updateFeatureSelection(extraIpAddon._id, false)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                          activeFeatureIds.includes(extraIpAddon._id)
                            ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            : "border-slate-900 bg-slate-950 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.9)]",
                        )}
                      >
                        No extra IP
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFeatureSelection(extraIpAddon._id, true)}
                        className={cn(
                          "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                          activeFeatureIds.includes(extraIpAddon._id)
                            ? "border-slate-900 bg-slate-950 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.9)]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        )}
                      >
                        Yes, add 1 extra IP
                      </button>
                    </div>
                  </div>
                ) : null}

                {otherFeatureAddons.length ? (
                  <div className="mt-5 grid gap-3 xl:grid-cols-2">
                    {otherFeatureAddons.map((addon) => {
                      const selected = activeFeatureIds.includes(addon._id);
                      return (
                        <OptionCard
                          key={addon._id}
                          icon={Sparkles}
                          title={addon.name}
                          description={addon.description}
                          priceLabel={formatAddonCharge(getAddonPrice(addon, billingCycle), billingCycle)}
                          selected={selected}
                          onClick={() => updateFeatureSelection(addon._id, !selected)}
                        >
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {selected ? "Selected" : "Optional"}
                          </span>
                        </OptionCard>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-slate-950">Final Deployment Note</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Add anything the admin team should know for provisioning. Login details will be assigned by the admin team after the order is created and approved.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <TextArea
                  placeholder="Example: install Docker, prefer UTC timezone, deploy in Singapore for APAC traffic, or keep the hostname aligned to our project name."
                  value={finalNote}
                  onChange={(event) => setFinalNote(event.target.value)}
                  className="min-h-32"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Renewal Billing</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Once the order is approved and activated, renewals use your wallet balance first. If the wallet does not fully cover the due amount, the remaining balance can be charged to your saved card automatically.
              </p>
              <div className="mt-4">
                <Link href="/portal/payments">
                  <Button variant="ghost">Top Up Wallet</Button>
                </Link>
              </div>
            </div>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
            <CardDescription>Managed by ElevenOrbits Team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Plan" value={plan.name} />
            <SummaryRow label="Category" value={plan.categoryId?.name || "Managed Service"} />
            <SummaryRow label="Billing Cycle" value={billingCycle[0].toUpperCase() + billingCycle.slice(1)} />

            {selectedRegion ? <SummaryRow label="Region" value={selectedRegion.name} /> : null}
            {selectedStorage ? (
              <SummaryRow
                label="Storage"
                value={`${normalizedStorageQuantity} ${selectedStorage.unitLabel || "GB"} ${selectedStorage.name}`}
              />
            ) : null}
            {selectedImage ? <SummaryRow label="Image" value={selectedImage.name} /> : null}
            {selectedFeatures.map((addon) => (
              <SummaryRow key={addon._id} label="Add-on" value={addon.name} />
            ))}
            {finalNote.trim() ? <SummaryRow label="Team Note" value="Included with order" /> : null}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Charges</p>
              <div className="mt-3 space-y-3">
                {summaryItems.map((item) => (
                  <SummaryRow key={item.label} label={item.label} value={formatCurrency(item.amount)} />
                ))}
              </div>
            </div>

            <SummaryRow label="Monthly Service Total" value={formatCurrency(monthlyTotal)} />
            <SummaryRow
              label="Total Due Today"
              value={plan.contactSalesOnly ? plan.displayPriceLabel || "Contact sales" : formatCurrency(total)}
              emphasized
            />

            <Button className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Creating order..." : plan.contactSalesOnly ? "Talk to Sales" : "Create Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
