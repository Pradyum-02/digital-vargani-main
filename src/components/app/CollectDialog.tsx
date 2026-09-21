import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Download,
  MessageCircle,
  Printer,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { formatINR, toDateInput } from "@/lib/format";

import {
  PAYMENT_METHODS,
  type Collection,
  type PaymentMethod,
} from "@/types";

import {
  addCollection,
  addHousehold,
  findHouseholdByLocation,
  useAppData,
} from "@/services/store";

import { currentUser, summaryFor } from "@/services/selectors";
import { useAuth } from "@/services/auth";

import { paymentService } from "@/services/payments";

import {
  downloadPauti,
  pautiBlob,
  printPauti,
} from "@/services/pdf";

import {
  receiptText,
  whatsAppService,
} from "@/services/whatsapp";

import { MethodBadge } from "./ui-bits";

/* =========================================================
   PAUTI ACTIONS
========================================================= */

export function PautiActions({
  collection,
  size = "sm",
}: {
  collection: Collection;
  size?: "sm" | "default";
}) {
  const data = useAppData();

  const summary = summaryFor(
    data,
    collection.householdId,
  );

  const share = async () => {
    if (!summary) return;

    const result =
      await whatsAppService.sendReceipt({
        to: summary.household.mobile,

        text: receiptText({
          residentName:
            summary.household.residentName,

          flatNo:
            summary.household.flatNo,

          amount:
            collection.amount,

          pautiNo:
            collection.pautiNo,

          mandalName:
            data.mandal.name,

          year:
            data.mandal.year,
        }),

        attachment: {
          filename:
            `${collection.pautiNo}.pdf`,

          blob: pautiBlob({
            collection,
            data,
          }),
        },
      });

    toast(
      result.ok
        ? "WhatsApp opened"
        : "Could not open WhatsApp",
      {
        description: result.detail,
      },
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size={size}
        variant="outline"
        onClick={() =>
          downloadPauti({
            collection,
            data,
          })
        }
      >
        <Download className="h-4 w-4" />
        PDF
      </Button>

      <Button
        size={size}
        variant="outline"
        onClick={() =>
          printPauti({
            collection,
            data,
          })
        }
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>

      <Button
        size={size}
        variant="outline"
        onClick={share}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </Button>
    </div>
  );
}

/* =========================================================
   MAIN COLLECTION DIALOG
========================================================= */

export function CollectDialog({
  householdId,
  open,
  onOpenChange,
}: {
  householdId: string | null;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const data = useAppData();
  const user = currentUser(data);
  const { profile, session } = useAuth();

  /*
   * Automatically find the logged-in collector
   * using their authenticated email.
   */
  const loggedInCollector = useMemo(() => {
    if (
      profile?.role !== "COLLECTOR" ||
      !profile.active ||
      !session?.user?.email
    ) {
      return undefined;
    }

    const email =
      session.user.email.trim().toLowerCase();

    return data.collectors.find(
      (collector) =>
        collector.active &&
        collector.email.trim().toLowerCase() ===
          email,
    );
  }, [
    data.collectors,
    profile?.active,
    profile?.role,
    session?.user?.email,
  ]);

  const existingSummary = householdId
    ? summaryFor(data, householdId)
    : undefined;

  const [buildingId, setBuildingId] =
    useState(data.buildings[0]?.id ?? "");

  const wings = useMemo(
    () =>
      data.wings.filter(
        (wing) =>
          wing.buildingId === buildingId,
      ),
    [data.wings, buildingId],
  );

  const [wingId, setWingId] =
    useState(wings[0]?.id ?? "");

  const [floor, setFloor] =
    useState("");

  const [flatNo, setFlatNo] =
    useState("");

  const [residentName, setResidentName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [method, setMethod] =
    useState<PaymentMethod>("UPI");

  const [collectorId, setCollectorId] =
    useState(
      loggedInCollector?.id ??
        user?.id ??
        "",
    );

  const [date, setDate] =
    useState(
      toDateInput(
        new Date().toISOString(),
      ),
    );

  const [notes, setNotes] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [receipt, setReceipt] =
    useState<Collection | null>(null);

  /*
   * For a collector, this is ALWAYS the
   * authenticated collector's ID.
   *
   * For an admin, the selected collector
   * from the dropdown is used.
   */
  const effectiveCollectorId =
    profile?.role === "COLLECTOR" &&
    loggedInCollector
      ? loggedInCollector.id
      : collectorId;

  /*
   * Keep wing valid when phase changes.
   */
  useEffect(() => {
    const availableWings =
      data.wings.filter(
        (wing) =>
          wing.buildingId === buildingId,
      );

    if (
      !availableWings.some(
        (wing) => wing.id === wingId,
      )
    ) {
      setWingId(
        availableWings[0]?.id ?? "",
      );
    }
  }, [
    buildingId,
    data.wings,
    wingId,
  ]);

  /*
   * Reset form whenever the dialog opens
   * or household changes.
   */
  useEffect(() => {
    if (!open) return;

    const firstBuilding =
      data.buildings[0];

    setBuildingId(
      firstBuilding?.id ?? "",
    );

    const firstWing =
      data.wings.find(
        (wing) =>
          wing.buildingId ===
          firstBuilding?.id,
      );

    setWingId(
      firstWing?.id ?? "",
    );

    setFloor("");
    setFlatNo("");
    setResidentName("");
    setMobile("");

    if (existingSummary) {
      setAmount(
        String(
          existingSummary.remaining > 0
            ? existingSummary.remaining
            : existingSummary.household
                .expectedAmount,
        ),
      );

      setCollectorId(
        loggedInCollector?.id ??
          existingSummary.household
            .collectorId ??
          user?.id ??
          "",
      );
    } else {
      setAmount(
        data.mandal.defaultVarganiAmount > 0
          ? String(
              data.mandal
                .defaultVarganiAmount,
            )
          : "",
      );

      setCollectorId(
        loggedInCollector?.id ??
          user?.id ??
          "",
      );
    }

    setMethod("UPI");

    setDate(
      toDateInput(
        new Date().toISOString(),
      ),
    );

    setNotes("");
    setReceipt(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    householdId,
    loggedInCollector?.id,
  ]);

  /*
   * =======================================================
   * EXISTING HOUSEHOLD
   * =======================================================
   */

  if (existingSummary) {
    return (
      <ExistingHouseholdCollection
        summary={existingSummary}
        open={open}
        onOpenChange={onOpenChange}
        collectorId={collectorId}
        setCollectorId={setCollectorId}
        amount={amount}
        setAmount={setAmount}
        method={method}
        setMethod={setMethod}
        date={date}
        setDate={setDate}
        notes={notes}
        setNotes={setNotes}
        saving={saving}
        setSaving={setSaving}
        receipt={receipt}
        setReceipt={setReceipt}
        data={data}
      />
    );
  }

  /*
   * =======================================================
   * NEW HOUSEHOLD
   * =======================================================
   */

  const submitNewHousehold = async () => {
    if (!buildingId) {
      toast.error("Select a phase");
      return;
    }

    if (!wingId) {
      toast.error("Select a wing");
      return;
    }

    const floorNumber = Number(floor);

    if (
      !Number.isInteger(floorNumber) ||
      floorNumber <= 0
    ) {
      toast.error(
        "Enter a valid floor number",
      );
      return;
    }

    const normalizedFlat =
      flatNo.trim().toUpperCase();

    if (!normalizedFlat) {
      toast.error(
        "Enter the flat number",
      );
      return;
    }

    const normalizedResident =
      residentName.trim();

    if (!normalizedResident) {
      toast.error(
        "Enter resident name",
      );
      return;
    }

    const normalizedMobile =
      mobile.replace(/\D/g, "");

    if (
      !/^[6-9]\d{9}$/.test(
        normalizedMobile,
      )
    ) {
      toast.error(
        "Enter a valid 10-digit mobile number",
      );
      return;
    }

    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      toast.error(
        "Enter a valid Vargani amount",
      );
      return;
    }

    if (!effectiveCollectorId) {
      toast.error(
        "Collector account is not linked",
      );
      return;
    }

    const duplicate =
      findHouseholdByLocation({
        buildingId,
        wingId,
        floor: floorNumber,
        flatNo: normalizedFlat,
      });

    if (duplicate) {
      toast.error(
        "This household already exists",
        {
          description:
            `${duplicate.flatNo} is already registered. ` +
            "Please use the existing household.",
        },
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * Verify payment BEFORE creating household.
       */
      const verification =
        await paymentService.verify({
          amount: Math.round(value),
          method,
        });

      if (!verification.verified) {
        toast.error(
          "Unable to save collection",
          {
            description:
              verification.message,
          },
        );

        return;
      }

      /*
       * Create household.
       */
      const household =
        addHousehold({
          buildingId,
          wingId,
          floor: floorNumber,

          flatNo:
            normalizedFlat,

          residentName:
            normalizedResident,

          mobile:
            normalizedMobile,

          expectedAmount:
            Math.round(value),

          previousYearAmount: 0,

          exempt: false,

          collectorId:
            effectiveCollectorId,

          notes:
            notes.trim() ||
            undefined,
        });

      /*
       * Record collection.
       */
      const created =
        addCollection({
          householdId:
            household.id,

          amount:
            Math.round(value),

          method,

          collectorId:
            effectiveCollectorId,

          date:
            new Date(
              `${date}T${new Date()
                .toTimeString()
                .slice(0, 8)}`,
            ).toISOString(),

          notes:
            notes.trim() ||
            undefined,
        });

      setReceipt(created);

      toast.success(
        "Household added & collection recorded",
        {
          description:
            `Pauti ${created.pautiNo} generated.`,
        },
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to save household",
        {
          description:
            "Please try again.",
        },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {receipt ? (
          <SuccessReceipt
            collection={receipt}
            onOpenChange={
              onOpenChange
            }
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Add Household & Collect
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* LOCATION */}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>
                    Phase
                  </Label>

                  <Select
                    value={buildingId}
                    onValueChange={
                      setBuildingId
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>

                    <SelectContent>
                      {data.buildings.map(
                        (building) => (
                          <SelectItem
                            key={
                              building.id
                            }
                            value={
                              building.id
                            }
                          >
                            {building.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Wing
                  </Label>

                  <Select
                    value={wingId}
                    onValueChange={
                      setWingId
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select wing" />
                    </SelectTrigger>

                    <SelectContent>
                      {wings.map(
                        (wing) => (
                          <SelectItem
                            key={
                              wing.id
                            }
                            value={
                              wing.id
                            }
                          >
                            Wing {wing.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    Floor
                  </Label>

                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={floor}
                    onChange={(event) =>
                      setFloor(
                        event.target.value.replace(
                          /\D/g,
                          "",
                        ),
                      )
                    }
                    placeholder="2"
                  />
                </div>

                <div>
                  <Label>
                    Flat number
                  </Label>

                  <Input
                    className="mt-1"
                    value={flatNo}
                    onChange={(event) =>
                      setFlatNo(
                        event.target.value,
                      )
                    }
                    placeholder="204"
                  />
                </div>
              </div>

              {/* LOCATION PREVIEW */}

              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Household location
                </p>

                <p className="mt-1 font-semibold">
                  {
                    data.buildings.find(
                      (building) =>
                        building.id ===
                        buildingId,
                    )?.name
                  }

                  {" · "}

                  Wing{" "}
                  {
                    wings.find(
                      (wing) =>
                        wing.id ===
                        wingId,
                    )?.name
                  }

                  {" · "}

                  {floor
                    ? `Floor ${floor}`
                    : "Floor —"}

                  {" · "}

                  {flatNo ||
                    "Flat —"}
                </p>
              </div>

              {/* RESIDENT */}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>
                    Resident name
                  </Label>

                  <Input
                    className="mt-1"
                    value={
                      residentName
                    }
                    onChange={(event) =>
                      setResidentName(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Resident name"
                  />
                </div>

                <div>
                  <Label>
                    Mobile number
                  </Label>

                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(event) =>
                      setMobile(
                        event.target.value
                          .replace(
                            /\D/g,
                            "",
                          )
                          .slice(0, 10),
                      )
                    }
                    placeholder="98XXXXXXXX"
                  />
                </div>
              </div>

              {/* AMOUNT */}

              <div>
                <Label>
                  Vargani amount
                </Label>

                <Input
                  inputMode="numeric"
                  className="num mt-1 h-14 text-2xl font-bold"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="501"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {[501, 1001, 2100]
                    .filter(
                      (value) =>
                        value > 0,
                    )
                    .map(
                      (value) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={
                            Number(
                              amount,
                            ) === value
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setAmount(
                              String(
                                value,
                              ),
                            )
                          }
                        >
                          {formatINR(
                            value,
                          )}
                        </Button>
                      ),
                    )}
                </div>
              </div>

              {/* PAYMENT METHOD */}

              <div>
                <Label>
                  Payment method
                </Label>

                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_METHODS.map(
                    (paymentMethod) => (
                      <button
                        key={
                          paymentMethod
                        }
                        type="button"
                        onClick={() =>
                          setMethod(
                            paymentMethod,
                          )
                        }
                        className={cn(
                          "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                          method ===
                            paymentMethod
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-card hover:bg-muted",
                        )}
                      >
                        {paymentMethod ===
                        "BANK"
                          ? "Bank"
                          : paymentMethod ===
                              "CHEQUE"
                            ? "Cheque"
                            : paymentMethod ===
                                "CASH"
                              ? "Cash"
                              : "UPI"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* COLLECTOR */}

              <div>
                <Label>
                  Collector
                </Label>

                {profile?.role ===
                "COLLECTOR" ? (
                  <div className="mt-1 rounded-xl border bg-muted/30 px-3 py-3">
                    <p className="font-semibold">
                      {loggedInCollector?.name ??
                        profile.name ??
                        "Current collector"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Automatically assigned to your account
                    </p>
                  </div>
                ) : (
                  <Select
                    value={collectorId}
                    onValueChange={
                      setCollectorId
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select collector" />
                    </SelectTrigger>

                    <SelectContent>
                      {data.collectors
                        .filter(
                          (collector) =>
                            collector.active,
                        )
                        .map(
                          (collector) => (
                            <SelectItem
                              key={
                                collector.id
                              }
                              value={
                                collector.id
                              }
                            >
                              {
                                collector.name
                              }
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* NOTES */}

              <div>
                <Label>
                  Notes
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  placeholder="UPI reference, cheque number, remarks…"
                />
              </div>

              {/* SUBMIT */}

              <Button
                className="h-13 w-full text-base font-bold"
                onClick={
                  submitNewHousehold
                }
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : "COLLECT VARGANI"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   EXISTING HOUSEHOLD COLLECTION
========================================================= */

function ExistingHouseholdCollection({
  summary,
  open,
  onOpenChange,
  collectorId,
  setCollectorId,
  amount,
  setAmount,
  method,
  setMethod,
  date,
  setDate,
  notes,
  setNotes,
  saving,
  setSaving,
  receipt,
  setReceipt,
  data,
}: {
  summary: NonNullable<
    ReturnType<typeof summaryFor>
  >;

  open: boolean;

  onOpenChange: (
    value: boolean,
  ) => void;

  collectorId: string;

  setCollectorId: (
    value: string,
  ) => void;

  amount: string;

  setAmount: (
    value: string,
  ) => void;

  method: PaymentMethod;

  setMethod: (
    value: PaymentMethod,
  ) => void;

  date: string;

  setDate: (
    value: string,
  ) => void;

  notes: string;

  setNotes: (
    value: string,
  ) => void;

  saving: boolean;

  setSaving: (
    value: boolean,
  ) => void;

  receipt: Collection | null;

  setReceipt: (
    value: Collection | null,
  ) => void;

  data: ReturnType<
    typeof useAppData
  >;
}) {
  const { profile, session } =
    useAuth();

  /*
   * Find the logged-in collector again
   * for existing-household collections.
   */
  const loggedInCollector = useMemo(() => {
    if (
      profile?.role !== "COLLECTOR" ||
      !profile.active ||
      !session?.user?.email
    ) {
      return undefined;
    }

    const email =
      session.user.email
        .trim()
        .toLowerCase();

    return data.collectors.find(
      (collector) =>
        collector.active &&
        collector.email
          .trim()
          .toLowerCase() ===
          email,
    );
  }, [
    data.collectors,
    profile?.active,
    profile?.role,
    session?.user?.email,
  ]);

  const effectiveCollectorId =
    profile?.role === "COLLECTOR" &&
    loggedInCollector
      ? loggedInCollector.id
      : collectorId;

  const submit = async () => {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      toast.error(
        "Enter a valid amount",
      );
      return;
    }

    if (!effectiveCollectorId) {
      toast.error(
        "Collector account is not linked",
      );
      return;
    }

    /*
     * Don't allow collection greater
     * than outstanding amount.
     */
    if (
      summary.remaining > 0 &&
      value > summary.remaining
    ) {
      toast.error(
        "Amount is greater than remaining Vargani",
        {
          description:
            `Maximum remaining amount is ${formatINR(
              summary.remaining,
            )}.`,
        },
      );
      return;
    }

    /*
     * Don't collect from an already
     * fully paid household.
     */
    if (
      summary.remaining <= 0
    ) {
      toast.error(
        "Vargani is already fully paid",
      );
      return;
    }

    setSaving(true);

    try {
      const verification =
        await paymentService.verify({
          amount: Math.round(value),
          method,
        });

      if (!verification.verified) {
        toast.error(
          "Unable to save collection",
          {
            description:
              verification.message,
          },
        );

        return;
      }

      const created =
        addCollection({
          householdId:
            summary.household.id,

          amount:
            Math.round(value),

          method,

          collectorId:
            effectiveCollectorId,

          date:
            new Date(
              `${date}T${new Date()
                .toTimeString()
                .slice(0, 8)}`,
            ).toISOString(),

          notes:
            notes.trim() ||
            undefined,
        });

      setReceipt(created);

      toast.success(
        "Collection recorded",
        {
          description:
            `Pauti ${created.pautiNo} generated.`,
        },
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Unable to save collection. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const quick = [
    501,
    1001,
    2100,
    summary.remaining,
  ].filter(
    (value, index, array) =>
      value > 0 &&
      array.indexOf(value) ===
        index &&
      value <=
        summary.remaining,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {receipt ? (
          <SuccessReceipt
            collection={receipt}
            onOpenChange={
              onOpenChange
            }
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />

                Collect Vargani

                <span className="deva text-sm font-normal text-muted-foreground">
                  वर्गणी
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* HOUSEHOLD SUMMARY */}

            <div className="rounded-xl bg-secondary p-4 text-secondary-foreground">
              <p className="text-lg font-bold">
                {summary.household.flatNo}
              </p>

              <p className="text-sm opacity-80">
                {
                  summary.household
                    .residentName
                }
              </p>

              <p className="mt-1 text-xs opacity-70">
                {summary.buildingName}
                {" · "}
                Wing {summary.wingName}
                {" · "}
                Floor{" "}
                {summary.household.floor}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Mini
                  label="Expected"
                  value={formatINR(
                    summary
                      .household
                      .expectedAmount,
                  )}
                />

                <Mini
                  label="Paid"
                  value={formatINR(
                    summary.paid,
                  )}
                />

                <Mini
                  label="Remaining"
                  value={formatINR(
                    summary.remaining,
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* AMOUNT */}

              <div>
                <Label>
                  Amount
                </Label>

                <Input
                  inputMode="numeric"
                  className="num mt-1 h-14 text-2xl font-bold"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="0"
                />

                <div className="mt-2 flex flex-wrap gap-2">
                  {quick.map(
                    (value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={
                          Number(
                            amount,
                          ) === value
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          setAmount(
                            String(
                              value,
                            ),
                          )
                        }
                      >
                        {formatINR(
                          value,
                        )}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              {/* PAYMENT */}

              <div>
                <Label>
                  Payment method
                </Label>

                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_METHODS.map(
                    (paymentMethod) => (
                      <button
                        key={
                          paymentMethod
                        }
                        type="button"
                        onClick={() =>
                          setMethod(
                            paymentMethod,
                          )
                        }
                        className={cn(
                          "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                          method ===
                            paymentMethod
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-card hover:bg-muted",
                        )}
                      >
                        {paymentMethod ===
                        "BANK"
                          ? "Bank"
                          : paymentMethod ===
                              "CHEQUE"
                            ? "Cheque"
                            : paymentMethod ===
                                "CASH"
                              ? "Cash"
                              : "UPI"}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* COLLECTOR */}

              <div>
                <Label>
                  Collector
                </Label>

                {profile?.role ===
                "COLLECTOR" ? (
                  <div className="mt-1 rounded-xl border bg-muted/30 px-3 py-3">
                    <p className="font-semibold">
                      {loggedInCollector?.name ??
                        profile.name ??
                        "Current collector"}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Automatically assigned to your account
                    </p>
                  </div>
                ) : (
                  <Select
                    value={collectorId}
                    onValueChange={
                      setCollectorId
                    }
                  >
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select collector" />
                    </SelectTrigger>

                    <SelectContent>
                      {data.collectors
                        .filter(
                          (collector) =>
                            collector.active,
                        )
                        .map(
                          (collector) => (
                            <SelectItem
                              key={
                                collector.id
                              }
                              value={
                                collector.id
                              }
                            >
                              {
                                collector.name
                              }
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* DATE */}

              <div>
                <Label>
                  Date
                </Label>

                <Input
                  type="date"
                  className="mt-1"
                  value={date}
                  onChange={(event) =>
                    setDate(
                      event.target
                        .value,
                    )
                  }
                />
              </div>

              {/* NOTES */}

              <div>
                <Label>
                  Notes
                </Label>

                <Textarea
                  className="mt-1"
                  rows={2}
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target
                        .value,
                    )
                  }
                  placeholder="UPI reference, cheque number, remarks…"
                />
              </div>

              {/* SUBMIT */}

              <Button
                className="h-13 w-full text-base font-bold"
                onClick={submit}
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : "COLLECT VARGANI"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================
   SUCCESS RECEIPT
========================================================= */

function SuccessReceipt({
  collection,
  onOpenChange,
}: {
  collection: Collection;
  onOpenChange: (
    value: boolean,
  ) => void;
}) {
  const data = useAppData();

  const summary = summaryFor(
    data,
    collection.householdId,
  );

  if (!summary) return null;

  return (
    <div className="space-y-4 py-2 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />

      <div>
        <h3 className="text-lg font-bold">
          Collection Recorded
        </h3>

        <p className="deva text-sm text-muted-foreground">
          वर्गणी जमा झाली
        </p>
      </div>

      <div className="rounded-xl border bg-muted/40 p-4 text-left">
        <Row
          label="Amount"
          value={formatINR(
            collection.amount,
          )}
          strong
        />

        <Row
          label="Payment"
          value={
            <MethodBadge
              method={
                collection.method
              }
            />
          }
        />

        <Row
          label="Pauti"
          value={
            collection.pautiNo
          }
        />

        <Row
          label="Household"
          value={`${summary.household.flatNo} · ${summary.household.residentName}`}
        />

        <Row
          label="Remaining"
          value={formatINR(
            summary.remaining,
          )}
        />
      </div>

      <div className="flex justify-center">
        <PautiActions
          collection={
            collection
          }
        />
      </div>

      <Button
        className="w-full"
        onClick={() =>
          onOpenChange(false)
        }
      >
        Done
      </Button>
    </div>
  );
}

/* =========================================================
   MINI STAT
========================================================= */

function Mini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-card/10 py-2">
      <p className="text-[10px] tracking-wider uppercase opacity-70">
        {label}
      </p>

      <p className="num text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   ROW
========================================================= */

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      <span
        className={cn(
          "text-sm",
          strong &&
            "num text-base font-bold",
        )}
      >
        {value}
      </span>
    </div>
  );
}