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
  ArrowLeft,
  ArrowRight,
  Archive,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDollarSign,
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
  ShoppingCart,
  Sparkles,
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
  isServiceIntakeFieldVisible,
  validateServiceIntakeAnswers,
} from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { apiFetch } from "@/lib/api/client";
import { useCart } from "@/lib/cart/use-cart";
import { OrderJourney } from "@/components/portal/order-journey";

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
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        selected
          ? "border-accent-400 bg-gradient-to-br from-accent-50 via-white to-white shadow-card-hover ring-1 ring-accent-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 hover:shadow-card-hover",
      )}
    >
      {selected ? <span className="absolute inset-y-0 left-0 w-1 bg-accent-500" aria-hidden="true" /> : null}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {artwork ? (
            <ImageOptionMark artwork={artwork} selected={selected} />
          ) : (
            <span
              className={cn(
                "mt-0.5 rounded-xl p-2.5 transition-colors",
                selected ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-600 group-hover:bg-white",
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
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
            selected ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white",
          )}
        >
          {selected ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-slate-200" />}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", selected ? "bg-accent-100 text-accent-800" : "bg-slate-100 text-slate-700")}>
          {priceLabel}
        </span>
        {children}
      </div>
    </button>
  );
}

function BillingCycleCard({ plan, cycle, selected, onClick }) {
  const discount = getBillingCycleDiscountPercent(plan, cycle);
  const isBestValue = cycle === "yearly";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        selected
          ? "border-accent-400 bg-gradient-to-br from-accent-50 via-white to-white shadow-card-hover ring-1 ring-accent-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-card-hover",
      )}
    >
      {selected ? <span className="absolute inset-x-0 top-0 h-1 bg-accent-500" aria-hidden="true" /> : null}
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", selected ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-500")}>
          <CircleDollarSign className="h-4 w-4" />
        </span>
        {isBestValue ? (
          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">Best value</span>
        ) : selected ? (
          <CheckCircle2 className="h-5 w-5 text-accent-600" />
        ) : null}
      </div>
      <p className="mt-4 font-semibold text-slate-950">{getBillingCycleLabel(cycle)}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{formatCurrency(calculatePlanPrice(plan, cycle))}</p>
      <div className="mt-2 flex min-h-5 items-center gap-2">
        {discount ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Save {discount}%</span> : null}
        <span className="text-xs text-slate-500">{getBillingSuffix(cycle).replace("/", "per ")}</span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{getBillingCycleDescription(plan, cycle)}</p>
    </button>
  );
}

function ConfiguratorStepNav({ steps, currentId, onSelect }) {
  const currentIndex = Math.max(steps.findIndex((step) => step.id === currentId), 0);

  return (
    <div className="border-b border-line bg-slate-50/80 p-3 sm:p-4">
      <div className="eo-scrollbar-none flex gap-2 overflow-x-auto" role="tablist" aria-label="Configuration steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = step.id === currentId;
          const complete = index < currentIndex;

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(step.id)}
              className={cn(
                "flex min-w-[190px] flex-1 items-center gap-3 rounded-xl border px-3 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
                active ? "border-slate-300 bg-white shadow-card" : "border-transparent hover:border-slate-200 hover:bg-white/80",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                  active && "border-accent-500 bg-accent-50 text-accent-700",
                  complete && !active && "border-emerald-500 bg-emerald-500 text-white",
                  !active && !complete && "border-slate-200 bg-white text-slate-400",
                )}
              >
                {complete ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Step {index + 1}</span>
                <span className={cn("mt-0.5 block truncate text-sm font-semibold", active ? "text-slate-950" : "text-slate-600")}>{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
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
        selected ? "ring-accent-300" : "ring-slate-200",
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
        selected ? "bg-accent-100 text-accent-700" : "bg-slate-100 text-slate-600",
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
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[88px] items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2",
        selected
          ? "border-accent-400 bg-gradient-to-br from-accent-50 via-white to-white shadow-card ring-1 ring-accent-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-card",
      )}
    >
      {selected ? <span className="absolute inset-y-0 left-0 w-1 bg-accent-500" aria-hidden="true" /> : null}
      <RequirementIcon icon={option.icon} logo={option.logo} label={option.label} selected={selected} compact />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
        {option.description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span> : null}
      </span>
      <span
        className={cn(
          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center border",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white",
        )}
      >
        {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </span>
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

function isIntakeFieldVisible(field, answers) {
  return isServiceIntakeFieldVisible(field, answers);
}

function pruneHiddenIntakeAnswers(answers, config) {
  if (!config) {
    return answers;
  }

  const next = { ...answers };
  (config.sections || []).forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (!isIntakeFieldVisible(field, next)) {
        delete next[field.key];
      }
    });
  });
  return next;
}

function ServiceRequirementsSection({ config, answers, errors, onChange }) {
  if (!config) {
    return null;
  }

  return (
    <div>
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
            <section key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
                  <SectionIcon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-slate-950">{section.title}</h3>
                  {section.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{section.description}</p> : null}
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {section.fields
                  .filter((field) => isIntakeFieldVisible(field, answers))
                  .map((field) => (
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
  const { userId } = useAuth();
  const { showToast } = useActionToast();
  const { item: cartItem, isHydrated: cartIsHydrated, saveItem } = useCart(userId);
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
  const [restoredCartVersion, setRestoredCartVersion] = useState("");
  const [activeConfiguratorStep, setActiveConfiguratorStep] = useState("plan");

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
  const hasDeploymentOptions = Boolean(regionOptions.length || storageOptions.length || imageOptions.length);
  const configuratorSteps = useMemo(
    () => [
      {
        id: "plan",
        label: "Plan & term",
        title: "Choose your commercial foundation",
        description: "Start with the contract that fits your budget and preferred commitment.",
        icon: CircleDollarSign,
      },
      ...(serviceIntakeConfig
        ? [
            {
              id: "requirements",
              label: "Your needs",
              title: "Tell us what you are building",
              description: "A focused intake helps our team provision the right environment the first time.",
              icon: ClipboardList,
            },
          ]
        : []),
      ...(hasDeploymentOptions
        ? [
            {
              id: "deployment",
              label: "Deployment",
              title: "Shape the managed environment",
              description: "Confirm where it runs, how it is sized, and which system image it uses.",
              icon: Globe2,
            },
          ]
        : []),
      {
        id: "addons",
        label: "Finish",
        title: "Add the finishing touches",
        description: "Choose optional enhancements, add a team note, and review the live estimate.",
        icon: Sparkles,
      },
    ],
    [hasDeploymentOptions, serviceIntakeConfig],
  );
  const currentConfiguratorStepIndex = Math.max(
    configuratorSteps.findIndex((step) => step.id === activeConfiguratorStep),
    0,
  );
  const currentConfiguratorStep = configuratorSteps[currentConfiguratorStepIndex];
  const previousConfiguratorStep = configuratorSteps[currentConfiguratorStepIndex - 1] || null;
  const nextConfiguratorStep = configuratorSteps[currentConfiguratorStepIndex + 1] || null;
  const isFinalConfiguratorStep = !nextConfiguratorStep;
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

  useEffect(() => {
    if (configuratorSteps.some((step) => step.id === activeConfiguratorStep)) {
      return;
    }

    setActiveConfiguratorStep(configuratorSteps[0]?.id || "plan");
  }, [activeConfiguratorStep, configuratorSteps]);

  useEffect(() => {
    if (
      !cartIsHydrated ||
      !plan ||
      addonsQuery.isLoading ||
      cartItem?.plan?.id !== plan._id ||
      restoredCartVersion === cartItem.updatedAt
    ) {
      return;
    }

    const payload = cartItem.payload || {};
    setBillingCycle(payload.billingCycle || "monthly");
    setSelectedAddonIds(payload.addonIds || []);
    setSelectedRegionId(payload.selectedRegionId || "");
    setSelectedImageId(payload.selectedImageId || "");
    setSelectedStorageId(payload.selectedStorageId || "");
    setStorageQuantity(payload.storageQuantity ? String(payload.storageQuantity) : "");
    setServiceAnswers(payload.serviceConfiguration?.answers || {});
    setFinalNote(payload.finalNote || "");
    setShowFinalNote(Boolean(payload.finalNote));
    setTrialRequested(Boolean(payload.trialRequested));
    setActiveConfiguratorStep("addons");
    setRestoredCartVersion(cartItem.updatedAt);
  }, [addonsQuery.isLoading, cartIsHydrated, cartItem, plan, restoredCartVersion]);

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
  const dueToday = trialRequested ? 0 : total;
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
    setError("");
    setServiceAnswers((current) => ({
      ...pruneHiddenIntakeAnswers(
        {
          ...current,
          [key]: value,
        },
        serviceIntakeConfig,
      ),
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

  function focusConfigurator() {
    window.requestAnimationFrame(() => {
      document.getElementById("configurator-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function validateRequirementsForProgress() {
    if (!serviceIntakeConfig) {
      return true;
    }

    const validation = validateServiceIntakeAnswers(categorySlug, serviceAnswers, {
      categoryName: plan?.categoryId?.name || plan?.name || "",
    });

    if (validation.ok) {
      setServiceAnswerErrors({});
      setError("");
      return true;
    }

    setServiceAnswerErrors(validation.errors);
    setError("Complete the highlighted requirements to continue.");
    return false;
  }

  function moveToConfiguratorStep(stepId) {
    const targetIndex = configuratorSteps.findIndex((step) => step.id === stepId);
    if (targetIndex < 0) return;

    const requirementsIndex = configuratorSteps.findIndex((step) => step.id === "requirements");
    if (targetIndex > requirementsIndex && requirementsIndex >= 0 && !validateRequirementsForProgress()) {
      setActiveConfiguratorStep("requirements");
      focusConfigurator();
      return;
    }

    setError("");
    setActiveConfiguratorStep(stepId);
    focusConfigurator();
  }

  function handleStepSelect(stepId) {
    moveToConfiguratorStep(stepId);
  }

  function handleConfiguratorContinue() {
    if (nextConfiguratorStep) {
      moveToConfiguratorStep(nextConfiguratorStep.id);
    }
  }

  function handleAddToCart() {
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
        setActiveConfiguratorStep("requirements");
        focusConfigurator();
        throw new Error("Please complete the required service requirements before adding this service to your cart.");
      }

      const payload = {
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
      };

      saveItem({
        plan: {
          id: plan._id,
          slug: plan.slug,
          name: plan.name,
          categoryName: plan.categoryId?.name || "Managed Service",
          categorySlug,
        },
        payload,
        billingCycle,
        summaryItems,
        monthlyTotal,
        total,
        dueToday,
        trialRequested,
        selections: {
          region: selectedRegion?.name || "",
          image: selectedImage?.name || "",
          storage: selectedStorage
            ? `${normalizedStorageQuantity} ${selectedStorage.unitLabel || "GB"} ${selectedStorage.name}`
            : "",
          features: selectedFeatures.map((addon) => addon.name),
          requirementCount: intakeValidation.configuration?.summary?.length || 0,
          hasNote: Boolean(finalNote.trim()),
        },
      });
      showToast({
        type: "success",
        action: "Cart",
        title: "Configuration added to cart",
        description: "Review the details and total before you initiate checkout.",
      });
      router.push("/portal/cart");
    } catch (requestError) {
      setError(requestError.message);
      showToast({
        type: "error",
        action: "Cart",
        title: "Could not add to cart",
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
        subtitle="Build your managed service with clear pricing, then review everything in your cart before checkout."
        actions={
          <Link href="/portal/cart">
            <Button variant="ghost">
              <ShoppingCart className="h-4 w-4" />
              View cart
            </Button>
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-[1680px] px-6 pt-6 md:px-8 md:pt-8">
        <OrderJourney current="configure" />
      </div>
      <div className="mx-auto grid w-full max-w-[1680px] gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card id="configurator-workspace" className="scroll-mt-36 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-950 to-slate-800 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300">Managed service builder</p>
            <CardTitle className="mt-2 text-xl text-white">Configure your service</CardTitle>
            <CardDescription>
              <span className="text-slate-300">Choose the contract, deployment preferences, and managed add-ons that fit your workload.</span>
            </CardDescription>
          </CardHeader>
          <ConfiguratorStepNav steps={configuratorSteps} currentId={activeConfiguratorStep} onSelect={handleStepSelect} />
          <CardContent className="space-y-8">
            <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-800">
                    Step {currentConfiguratorStepIndex + 1} of {configuratorSteps.length}
                  </span>
                  <span className="text-xs font-medium text-slate-400">Guided setup</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950">{currentConfiguratorStep.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{currentConfiguratorStep.description}</p>
              </div>
              <div className="w-full max-w-[180px] pt-1">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <span>Setup progress</span>
                  <span>{Math.round(((currentConfiguratorStepIndex + 1) / configuratorSteps.length) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-700 transition-all duration-300"
                    style={{ width: `${((currentConfiguratorStepIndex + 1) / configuratorSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {activeConfiguratorStep === "plan" ? (
              <>
            <div className="grid gap-4 md:grid-cols-3">
              {availableBillingCycles.map((cycle) => (
                <BillingCycleCard
                  key={cycle}
                  plan={plan}
                  cycle={cycle}
                  selected={billingCycle === cycle}
                  onClick={() => setBillingCycle(cycle)}
                />
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
              </>
            ) : null}

            {activeConfiguratorStep === "requirements" ? (
              <ServiceRequirementsSection
                config={serviceIntakeConfig}
                answers={serviceAnswers}
                errors={serviceAnswerErrors}
                onChange={updateServiceAnswer}
              />
            ) : null}

            {activeConfiguratorStep === "deployment" ? (
              <>
            <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-200">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-sky-950">Smart defaults are already selected</p>
                <p className="mt-1 text-xs leading-5 text-sky-700">
                  We started with the first compatible region, storage profile, and system image so you only need to change what matters.
                </p>
              </div>
            </div>
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
              </>
            ) : null}

            {activeConfiguratorStep === "addons" ? (
              <>
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
                        aria-pressed={!activeFeatureIds.includes(extraIpAddon._id)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                          activeFeatureIds.includes(extraIpAddon._id)
                            ? "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            : "border-accent-400 bg-accent-50 text-accent-800 ring-1 ring-accent-200",
                        )}
                      >
                        <span>No extra IP</span>
                        {!activeFeatureIds.includes(extraIpAddon._id) ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFeatureSelection(extraIpAddon._id, true)}
                        aria-pressed={activeFeatureIds.includes(extraIpAddon._id)}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition",
                          activeFeatureIds.includes(extraIpAddon._id)
                            ? "border-accent-400 bg-accent-50 text-accent-800 ring-1 ring-accent-200"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        )}
                      >
                        <span>Yes, add 1 extra IP</span>
                        {activeFeatureIds.includes(extraIpAddon._id) ? <CheckCircle2 className="h-4 w-4" /> : null}
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
              </>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              {previousConfiguratorStep ? (
                <Button type="button" variant="ghost" onClick={() => moveToConfiguratorStep(previousConfiguratorStep.id)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back to {previousConfiguratorStep.label}
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {nextConfiguratorStep ? (
                <Button type="button" onClick={handleConfiguratorContinue}>
                  Continue to {nextConfiguratorStep.label}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Configuration ready for cart
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-[8.5rem]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700">Live estimate</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {currentConfiguratorStepIndex + 1}/{configuratorSteps.length}
              </span>
            </div>
            <CardTitle className="mt-1">Your configuration</CardTitle>
            <CardDescription>Updates instantly as you make each selection.</CardDescription>
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
              value={plan.contactSalesOnly ? plan.displayPriceLabel || "Contact sales" : formatCurrency(dueToday)}
              emphasized
            />

            {trialRequested ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700">3-Day Trial Requested</p>
                <p className="mt-1 text-xs text-emerald-600">No payment required at checkout. Trial activation is subject to team review.</p>
              </div>
            ) : null}

            <div className={cn("rounded-xl border p-3.5", isFinalConfiguratorStep ? "border-emerald-200 bg-emerald-50" : "border-sky-200 bg-sky-50")}>
              <div className="flex items-start gap-2.5">
                {isFinalConfiguratorStep ? (
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                ) : (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                )}
                <p className={cn("text-xs leading-5", isFinalConfiguratorStep ? "text-emerald-800" : "text-sky-800")}>
                  {isFinalConfiguratorStep
                    ? "No charge is made here. You can review, edit, or remove this configuration from your cart first."
                    : "Your choices are kept while you move between steps. Continue when this section looks right."}
                </p>
              </div>
            </div>

            {nextConfiguratorStep ? (
              <Button className="w-full" onClick={handleConfiguratorContinue}>
                Continue to {nextConfiguratorStep.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="w-full" onClick={handleAddToCart} disabled={isSubmitting}>
                <ShoppingCart className="h-4 w-4" />
                {isSubmitting ? "Saving configuration..." : plan.contactSalesOnly ? "Talk to Sales" : "Add to cart"}
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>
            )}
            <p className="text-center text-xs leading-5 text-slate-500">
              {isFinalConfiguratorStep ? "Next: review your cart and initiate secure checkout." : `Current step: ${currentConfiguratorStep.label}`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
