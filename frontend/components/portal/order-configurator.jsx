"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Code2,
  Database,
  DownloadCloud,
  FileCheck,
  FileText,
  FlaskConical,
  Gauge,
  GitBranch,
  Globe2,
  HardDrive,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  LifeBuoy,
  List,
  ListChecks,
  LockKeyhole,
  Mail,
  Monitor,
  MousePointer2,
  Network,
  Package,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PlusCircle,
  Radio,
  RefreshCw,
  Repeat2,
  Route,
  Settings2,
  Shield,
  SlidersHorizontal,
  StepForward,
  Target,
  Terminal,
  Timer,
  Trash2,
  UploadCloud,
  UserRound,
  UsersRound,
  Voicemail,
  Webhook,
  Workflow,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldLabel,
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
  getAvailableBillingCycles,
  getBillingCycleDiscountPercent,
  getBillingCycleLabel,
  getBillingCycleMonths,
  getServiceIntakeConfig,
  getStorageMinimumQuantity,
  validateServiceIntakeAnswers,
} from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { apiFetch } from "@/lib/api/client";

function getBillingSuffix(billingCycle) {
  if (billingCycle === "yearly") {
    return "/year";
  }

  if (billingCycle === "six_month") {
    return "/6 months";
  }

  return "/month";
}

function formatAddonCharge(amount, billingCycle) {
  return amount > 0 ? `${formatCurrency(amount)}${getBillingSuffix(billingCycle)}` : "Included";
}

function getBillingCycleDescription(plan, billingCycle) {
  if (billingCycle === "monthly") {
    return "Flexible monthly contract. No term discount.";
  }

  const discountPercent = getBillingCycleDiscountPercent(plan, billingCycle);

  if (billingCycle === "yearly") {
    return `Yearly contract with ${discountPercent}% term discount.`;
  }

  return `${getBillingCycleMonths(billingCycle)} month contract with ${discountPercent}% term discount.`;
}

const defaultImageArtwork = {
  src: "https://cdn.simpleicons.org/linux/FCC624",
  alt: "Linux logo",
  shellClassName: "bg-amber-50 ring-amber-200",
};

const imageAddonArtwork = {
  "image-ubuntu": {
    src: "https://cdn.simpleicons.org/ubuntu/E95420",
    alt: "Ubuntu logo",
    shellClassName: "bg-orange-50 ring-orange-200",
  },
  "image-custom": {
    src: "https://cdn.simpleicons.org/linux/FCC624",
    alt: "Linux logo",
    shellClassName: "bg-amber-50 ring-amber-200",
  },
  "image-windows-server": {
    src: "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/windows11/windows11-original.svg",
    alt: "Windows logo",
    shellClassName: "bg-sky-50 ring-sky-200",
  },
  "image-cpanel": {
    src: "https://cdn.simpleicons.org/cpanel/FF6C2C",
    alt: "cPanel logo",
    shellClassName: "bg-orange-50 ring-orange-200",
  },
  "image-rhel": {
    src: "https://cdn.simpleicons.org/redhat/EE0000",
    alt: "Red Hat logo",
    shellClassName: "bg-rose-50 ring-rose-200",
  },
  "image-plesk-linux": {
    src: "https://cdn.simpleicons.org/plesk/52BBE6",
    alt: "Plesk logo",
    shellClassName: "bg-cyan-50 ring-cyan-200",
  },
};

const requirementIconMap = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  archive: Archive,
  "bar-chart": BarChart3,
  bot: Bot,
  brain: Brain,
  briefcase: Briefcase,
  calendar: Calendar,
  check: CheckCircle2,
  "check-circle": CheckCircle2,
  "check-square": CheckSquare,
  "clipboard-list": ClipboardList,
  cloud: Globe2,
  code: Code2,
  database: Database,
  "download-cloud": DownloadCloud,
  "file-check": FileCheck,
  "file-text": FileText,
  flask: FlaskConical,
  gauge: Gauge,
  "git-branch": GitBranch,
  globe: Globe2,
  "hard-drive": HardDrive,
  hash: List,
  headphones: Headphones,
  "help-circle": HelpCircle,
  image: ImageIcon,
  key: KeyRound,
  "life-buoy": LifeBuoy,
  list: List,
  "list-checks": ListChecks,
  lock: LockKeyhole,
  mail: Mail,
  monitor: Monitor,
  "mouse-pointer": MousePointer2,
  network: Network,
  package: Package,
  phone: Phone,
  "phone-call": PhoneCall,
  "phone-incoming": PhoneIncoming,
  "phone-outgoing": PhoneOutgoing,
  plus: PlusCircle,
  radio: Radio,
  refresh: RefreshCw,
  repeat: Repeat2,
  route: Route,
  server: Settings2,
  settings: Settings2,
  shield: Shield,
  sliders: SlidersHorizontal,
  "step-forward": StepForward,
  target: Target,
  terminal: Terminal,
  timer: Timer,
  trash: Trash2,
  "upload-cloud": UploadCloud,
  user: UserRound,
  users: UsersRound,
  voicemail: Voicemail,
  webhook: Webhook,
  workflow: Workflow,
  wrench: Wrench,
  x: X,
  zap: Zap,
};

function getRequirementIcon(name, fallback = Settings2) {
  return requirementIconMap[name] || fallback;
}

function getImageArtwork(addon) {
  return imageAddonArtwork[addon?.optionCode] || defaultImageArtwork;
}

function ImageOptionMark({ artwork, selected = false, compact = false }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl ring-1 transition",
        compact ? "h-10 w-10 p-2" : "mt-0.5 h-14 w-14 p-3",
        artwork.shellClassName,
        selected && "ring-sky-300",
      )}
    >
      <Image
        src={artwork.src}
        alt={artwork.alt}
        width={compact ? 24 : 32}
        height={compact ? 24 : 32}
        unoptimized
        loading="lazy"
        draggable={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
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

function OptionCard({ icon: Icon, artwork, title, description, priceLabel, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 text-left transition duration-200",
        selected
          ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600/30"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {artwork ? (
            <ImageOptionMark artwork={artwork} selected={selected} />
          ) : (
            <span
              className={cn(
                "mt-0.5 rounded-2xl p-2.5",
                selected ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
          )}
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

function RequirementLogo({ src, alt, selected = false, compact = false }) {
  if (!src) {
    return null;
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-white ring-1 transition",
        compact ? "h-10 w-10 p-2" : "h-12 w-12 p-2.5",
        selected ? "ring-brand-300" : "ring-slate-200",
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={compact ? 24 : 30}
        height={compact ? 24 : 30}
        unoptimized
        loading="lazy"
        draggable={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function RequirementIcon({ icon, logo, label, selected = false, compact = false }) {
  if (logo) {
    return <RequirementLogo src={logo} alt={`${label} logo`} selected={selected} compact={compact} />;
  }

  const Icon = getRequirementIcon(icon);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl transition",
        compact ? "h-10 w-10" : "h-12 w-12",
        selected ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600",
      )}
    >
      <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}

function toggleArrayValue(values, value) {
  const current = Array.isArray(values) ? values : [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function IntakeOptionButton({ option, selected, onClick, multi = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[84px] items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <RequirementIcon icon={option.icon} logo={option.logo} label={option.label} selected={selected} compact />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
        {option.description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span> : null}
      </span>
      {selected ? <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-600" /> : multi ? <span className="mt-1 h-4 w-4 shrink-0 rounded border border-slate-300" /> : null}
    </button>
  );
}

function IntakeField({ field, value, error, onChange }) {
  const requiredMark = field.required ? <span className="text-rose-500">*</span> : null;

  if (field.type === "select" || field.type === "segmented" || field.type === "multiselect") {
    const multi = field.type === "multiselect";
    const selectedValues = multi ? (Array.isArray(value) ? value : []) : [];
    return (
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <FieldLabel>
            {field.label} {requiredMark}
          </FieldLabel>
          {!multi && !field.required && value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Clear selection
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(field.options || []).map((option) => {
            const selected = multi ? selectedValues.includes(option.value) : value === option.value;
            return (
              <IntakeOptionButton
                key={option.value}
                option={option}
                selected={selected}
                multi={multi}
                onClick={() => onChange(multi ? toggleArrayValue(selectedValues, option.value) : option.value)}
              />
            );
          })}
        </div>
        {error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <FieldLabel>
          {field.label} {requiredMark}
        </FieldLabel>
        <TextArea
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className="min-h-28"
        />
        {error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <FieldLabel>
        {field.label} {requiredMark}
      </FieldLabel>
      <TextInput
        type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
        min={field.min}
        max={field.max}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
      {field.suffix ? <p className="mt-1.5 text-xs text-slate-500">Unit: {field.suffix}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}

function ServiceRequirementsSection({ config, answers, errors, onChange }) {
  if (!config) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <RequirementIcon icon="clipboard-list" logo={config.logo} label={config.title} />
        <div>
          <p className="text-lg font-semibold text-slate-950">Service Requirements</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{config.description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {config.sections.map((section) => {
          const SectionIcon = getRequirementIcon(section.icon);
          return (
            <section key={section.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                  <SectionIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
                  {section.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p> : null}
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {section.fields.map((field) => (
                  <IntakeField
                    key={field.key}
                    field={field}
                    value={answers[field.key]}
                    error={errors[field.key]}
                    onChange={(value) => onChange(field.key, value)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
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

const TRIAL_ELIGIBLE_SLUGS = new Set([
  "object-storage",
  "cybersecurity",
  "ai-servers",
  "vicidial",
  "hermes-ai-hosting",
  "openclaw-hosting",
  "nextcloud-hosting",
]);

export function OrderConfigurator({ slug }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");
  const [selectedStorageId, setSelectedStorageId] = useState("");
  const [storageQuantity, setStorageQuantity] = useState("");
  const [serviceAnswers, setServiceAnswers] = useState({});
  const [serviceAnswerErrors, setServiceAnswerErrors] = useState({});
  const [finalNote, setFinalNote] = useState("");
  const [showFinalNote, setShowFinalNote] = useState(false);
  const [trialRequested, setTrialRequested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-plan", slug],
    queryFn: () => apiFetch(`/catalog/plans/${slug}`),
  });

  const plan = data?.plan;
  const availableBillingCycles = useMemo(
    () => getAvailableBillingCycles(plan).filter((cycle) => cycle !== "contact_sales"),
    [plan],
  );
  const categorySlug = plan?.categoryId?.slug || "";
  const serviceIntakeConfig = getServiceIntakeConfig(categorySlug);
  const addonsQuery = useQuery({
    queryKey: ["catalog-addons", plan?.categoryId?.slug, plan?._id],
    queryFn: () => apiFetch(`/catalog/addons?category=${plan.categoryId.slug}&plan=${plan._id}`),
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
  const selectedImageArtwork = getImageArtwork(selectedImage || imageOptions[0]);
  const serviceIntakeValidation = useMemo(
    () => validateServiceIntakeAnswers(categorySlug, serviceAnswers, { categoryName: plan?.categoryId?.name || plan?.name || "" }),
    [categorySlug, plan?.categoryId?.name, plan?.name, serviceAnswers],
  );

  useEffect(() => {
    setServiceAnswers({});
    setServiceAnswerErrors({});
  }, [categorySlug]);

  useEffect(() => {
    if (!availableBillingCycles.length || availableBillingCycles.includes(billingCycle)) {
      return;
    }

    setBillingCycle(availableBillingCycles.includes("monthly") ? "monthly" : availableBillingCycles[0]);
  }, [availableBillingCycles, billingCycle]);

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

  function updateServiceAnswer(key, value) {
    setServiceAnswers((current) => ({
      ...current,
      [key]: value,
    }));
    setServiceAnswerErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
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
      router.push("/contact");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const intakeValidation = validateServiceIntakeAnswers(categorySlug, serviceAnswers, {
        categoryName: plan?.categoryId?.name || plan?.name || "",
      });
      if (!intakeValidation.ok) {
        setServiceAnswerErrors(intakeValidation.errors);
        throw new Error("Please complete the required service requirements before creating the order.");
      }

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
          serviceConfiguration: {
            answers: serviceAnswers,
          },
          finalNote: finalNote.trim() || undefined,
          trialRequested: trialRequested || undefined,
        },
      });
      showToast({
        type: "success",
        action: "Order",
        title: "Order created",
        description: "Your configuration has been saved and moved to checkout.",
      });
      router.push(`/portal/checkout/${data.order._id}`);
    } catch (requestError) {
      if (requestError.redirectUrl) {
        router.push(requestError.redirectUrl);
      }
      if (requestError.details?.fields) {
        setServiceAnswerErrors(requestError.details.fields);
      }
      setError(requestError.message);
      showToast({
        type: "error",
        action: "Order",
        title: "Order creation failed",
        description: requestError.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!plan) {
    if (isLoading) {
      return <PageLoader title="Order Configuration" subtitle="Loading plan details..." cardCount={2} lines={4} />;
    }

    return (
      <div>
        <Topbar title="Order Configuration" subtitle="Plan not found." />
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title={`Configure ${plan.name}`}
        subtitle="Choose billing, service details, optional add-ons, and provisioning notes before checkout."
      />
      <div className="mx-auto grid w-full max-w-[1680px] gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Order Flow</CardTitle>
            <CardDescription>
              Choose billing, service preferences, and any available managed add-ons. ElevenOrbits will handle provisioning and ongoing support.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              {availableBillingCycles.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "rounded-xl border p-5 text-left transition duration-200",
                    billingCycle === cycle
                      ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <p className="font-semibold text-slate-950">{getBillingCycleLabel(cycle)}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{getBillingCycleDescription(plan, cycle)}</p>
                </button>
              ))}
            </div>

            {TRIAL_ELIGIBLE_SLUGS.has(categorySlug) ? (
              <div
                className={cn(
                  "rounded-3xl border p-5 transition duration-200",
                  trialRequested
                    ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-400/30"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 rounded-2xl p-2.5 transition",
                        trialRequested ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <FlaskConical className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">
                        3-Day Free Trial
                        {trialRequested ? (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Requested
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Request a 3-day evaluation period at no charge. No immediate payment required — the ElevenOrbits team will review and activate the trial after verifying your order.
                      </p>
                    </div>
                  </div>
                  {trialRequested ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : null}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTrialRequested(false)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      trialRequested
                        ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        : "border-emerald-600 bg-emerald-600 text-white",
                    )}
                  >
                    Start with full service
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrialRequested(true)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                      trialRequested
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                    )}
                  >
                    Yes, request a 3-day trial
                  </button>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-white p-2.5 text-slate-700 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
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

            <ServiceRequirementsSection
              config={serviceIntakeConfig}
              answers={serviceAnswers}
              errors={serviceAnswerErrors}
              onChange={updateServiceAnswer}
            />

            {regionOptions.length ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Region</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Choose the region where you want ElevenOrbits to provision this managed service.
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
                  <ImageOptionMark artwork={selectedImageArtwork} selected compact />
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
                      artwork={getImageArtwork(addon)}
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
                            : "border-brand-600 bg-brand-600 text-white",
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
                            ? "border-brand-600 bg-brand-600 text-white"
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
                          icon={Settings2}
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                    <Settings2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">Custom Provisioning Note</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Use this only for details that are not covered by the selections above.
                    </p>
                  </div>
                </div>
                <Button type="button" variant="ghost" onClick={() => setShowFinalNote((current) => !current)}>
                  {showFinalNote || finalNote ? "Hide note" : "Add custom note"}
                </Button>
              </div>
              {showFinalNote || finalNote ? (
                <div className="mt-5">
                  <TextArea
                    placeholder="Example: preferred hostname, app domain, storage region, model/provider keys, user count, migration timing, cache rules, API access needs, or deployment notes."
                    value={finalNote}
                    onChange={(event) => setFinalNote(event.target.value)}
                    className="min-h-32"
                  />
                </div>
              ) : null}
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
            <CardDescription>Provisioning and support coverage included</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryRow label="Plan" value={plan.name} />
            <SummaryRow label="Category" value={plan.categoryId?.name || "Managed Service"} />
            <SummaryRow label="Contract" value={getBillingCycleLabel(billingCycle)} />

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
            {serviceIntakeValidation.configuration?.summary?.length ? (
              <SummaryRow label="Service Requirements" value={`${serviceIntakeValidation.configuration.summary.length} answers included`} />
            ) : null}
            {finalNote.trim() ? <SummaryRow label="Team Note" value="Included with order" /> : null}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Charges</p>
              <div className="mt-3 space-y-3">
                {summaryItems.map((item) => (
                  <SummaryRow key={item.label} label={item.label} value={formatCurrency(item.amount)} />
                ))}
              </div>
            </div>

            <SummaryRow
              label={billingCycle === "monthly" ? "Monthly Service Total" : "Monthly Equivalent"}
              value={formatCurrency(monthlyTotal)}
            />
            <SummaryRow
              label="Total Due Today"
              value={plan.contactSalesOnly ? plan.displayPriceLabel || "Contact sales" : formatCurrency(total)}
              emphasized
            />

            {trialRequested ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700">3-Day Trial Requested</p>
                <p className="mt-1 text-xs text-emerald-600">No payment required at checkout. Trial activation is subject to team review.</p>
              </div>
            ) : null}

            <Button className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting ? "Creating order..." : plan.contactSalesOnly ? "Talk to Sales" : trialRequested ? "Request 3-Day Trial" : "Create Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
