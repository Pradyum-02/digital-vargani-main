import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { supabase } from "@/lib/supabase";
import { buildSeedData } from "@/data/seed";
import { formatDate, formatINR } from "@/lib/format";
import { downloadPauti, printPauti } from "@/services/pdf";

import type {
  AppData,
  Collection,
  PaymentMethod,
} from "@/types";

type PublicPautiRow = {
  pauti_no: string;
  collection_id: string;
  household_id: string;
  amount: number | string;
  payment_method: string;
  collection_date: string;
  resident_name: string;
  flat_no: string;
  mobile: string;
  collector_name: string;
  mandal_name: string;
  mandal_name_marathi: string | null;
  mandal_address: string | null;
  mandal_phone: string | null;
  mandal_year: number;
  receipt_footer: string | null;
};

export const Route = createFileRoute("/pauti")({
  head: () => ({
    meta: [
      {
        title: "Check Pauti — Digital Vargani",
      },
      {
        name: "description",
        content:
          "Check and download your Ganpati Mandal Vargani Pauti using your Pauti number or registered mobile number.",
      },
      {
        property: "og:title",
        content: "Check Pauti — Digital Vargani",
      },
      {
        property: "og:description",
        content:
          "Securely check and download your digital Vargani Pauti.",
      },
    ],
  }),

  component: PublicPautiPage,
});

function PublicPautiPage() {
  const [pautiNo, setPautiNo] = useState("");
  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicPautiRow | null>(
    null,
  );
  const [error, setError] = useState("");

  const lookup = async () => {
    setError("");
    setResult(null);

    const cleanPauti = pautiNo.trim();
    const cleanMobile = mobile.replace(/\D/g, "");

    /*
     * At least one lookup value is required.
     *
     * Pauti number can be used alone.
     * Mobile number can be used alone.
     * Both can also be entered.
     */
    if (!cleanPauti && cleanMobile.length !== 10) {
      setError(
        "Enter either your Pauti number or your 10-digit registered mobile number.",
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_public_pauti",
        {
          p_pauti_no: cleanPauti,
          p_mobile: cleanMobile,
        },
      );

      if (rpcError) {
        console.error(
          "Pauti lookup failed:",
          rpcError,
        );

        setError(
          "Unable to check the Pauti right now. Please try again.",
        );

        return;
      }

      const row = Array.isArray(data)
        ? (data[0] as PublicPautiRow | undefined)
        : (data as PublicPautiRow | null);

      if (!row) {
        setError(
          "No Pauti found. Please check the details and try again.",
        );

        return;
      }

      setResult(row);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while checking the Pauti.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Convert the public RPC result into the AppData shape
   * expected by the existing Pauti PDF generator.
   */
  const buildPublicAppData = (): {
    data: AppData;
    collection: Collection;
  } | null => {
    if (!result) {
      return null;
    }

    const base = buildSeedData();

    const collectorId = "public-pauti-collector";

    const collection: Collection = {
      id: result.collection_id,
      pautiNo: result.pauti_no,
      householdId: result.household_id,
      amount: Number(result.amount),
      method:
        result.payment_method as PaymentMethod,
      collectorId,
      date: result.collection_date,
    };

    const data: AppData = {
      ...base,

      mandal: {
        ...base.mandal,
        name: result.mandal_name,
        nameMarathi:
          result.mandal_name_marathi ??
          base.mandal.nameMarathi,
        address:
          result.mandal_address ?? "",
        phone:
          result.mandal_phone ?? "",
        year: result.mandal_year,
        receiptFooter:
          result.receipt_footer ??
          base.mandal.receiptFooter,
      },

      households: [
        {
          id: result.household_id,
          buildingId: "",
          wingId: "",
          floor: 0,
          flatNo: result.flat_no,
          residentName:
            result.resident_name,
          mobile: result.mobile,
          expectedAmount:
            Number(result.amount),
          previousYearAmount: 0,
          exempt: false,
        },
      ],

      collectors: [
        {
          id: collectorId,
          name: result.collector_name,
          mobile: "",
          email: "",
          role: "COLLECTOR",
          active: true,
          wingIds: [],
        },
      ],

      collections: [collection],

      currentUserId: "",
    };

    return {
      data,
      collection,
    };
  };

  const handleDownload = () => {
    const payload = buildPublicAppData();

    if (!payload) {
      return;
    }

    downloadPauti({
      collection: payload.collection,
      data: payload.data,
    });
  };

  const handlePrint = () => {
    const payload = buildPublicAppData();

    if (!payload) {
      return;
    }

    printPauti({
      collection: payload.collection,
      data: payload.data,
    });
  };

  const resetLookup = () => {
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-muted/30">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="deva text-lg font-bold">
                ग
              </span>
            </div>

            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide">
                DIGITAL VARGANI
              </p>

              <p className="deva text-[11px] text-muted-foreground">
                डिजिटल वर्गणी
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4" />
            Secure Pauti Lookup
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        {!result ? (
          <>
            {/* Intro */}

            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-7 w-7" />
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Check Your Pauti
              </h1>

              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Enter your Pauti number or registered mobile
                number to securely view and download your
                Vargani receipt.
              </p>
            </div>

            {/* Lookup Card */}

            <div className="mx-auto mt-8 max-w-lg rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
              <div className="space-y-5">
                {/* Pauti */}

                <div>
                  <Label htmlFor="pauti-number">
                    Pauti Number
                    <span className="ml-1 font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <Input
                    id="pauti-number"
                    className="mt-2 h-11"
                    value={pautiNo}
                    onChange={(event) =>
                      setPautiNo(
                        event.target.value,
                      )
                    }
                    placeholder="GM-2026-00001"
                    autoComplete="off"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        lookup();
                      }
                    }}
                  />
                </div>

                {/* Mobile */}

                <div>
                  <Label htmlFor="mobile-number">
                    Registered Mobile Number
                    <span className="ml-1 font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <Input
                    id="mobile-number"
                    className="mt-2 h-11"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(event) =>
                      setMobile(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      )
                    }
                    placeholder="98XXXXXXXX"
                    autoComplete="tel"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        lookup();
                      }
                    }}
                  />
                </div>

                {/* Helper */}

                <div className="rounded-xl bg-muted/50 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  You can search using either your Pauti number
                  or your registered mobile number.
                </div>

                {/* Error */}

                {error ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                {/* Search */}

                <Button
                  className="h-11 w-full"
                  onClick={lookup}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Pauti...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Check Pauti
                    </>
                  )}
                </Button>
              </div>

              {/* Security */}

              <div className="mt-5 flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p>
                  Your Pauti is retrieved securely from the
                  Mandal's digital records.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* =================================================
                SUCCESS HEADER
            ================================================= */}

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
                Pauti Found
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Your Vargani contribution receipt is available
                below.
              </p>
            </div>

            {/* =================================================
                RECEIPT
            ================================================= */}

            <div className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
              {/* Orange Header */}

              <div className="bg-primary px-5 py-6 text-primary-foreground sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-lg font-bold sm:text-xl">
                      {result.mandal_name}
                    </p>

                    {result.mandal_name_marathi ? (
                      <p className="deva mt-1 text-sm opacity-90">
                        {result.mandal_name_marathi}
                      </p>
                    ) : null}
                  </div>

                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Digital Vargani
                    </p>

                    <p className="mt-1 text-[11px] opacity-80">
                      Official Collection Receipt
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Body */}

              <div className="p-5 sm:p-7">
                {/* Title */}

                <div className="text-center">
                  <p className="text-xl font-bold tracking-wide sm:text-2xl">
                    VARGANI RECEIPT
                  </p>

                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    PAUTI / CONTRIBUTION RECEIPT
                  </p>
                </div>

                {/* Pauti Details */}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Pauti Number
                    </p>

                    <p className="mt-1 font-bold">
                      {result.pauti_no}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Date
                    </p>

                    <p className="mt-1 font-bold">
                      {formatDate(
                        result.collection_date,
                      )}
                    </p>
                  </div>
                </div>

                {/* Contributor Details */}

                <div className="mt-7">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contributor Details
                  </p>

                  <div className="overflow-hidden rounded-xl border">
                    <ReceiptRow
                      label="Resident Name"
                      value={result.resident_name}
                    />

                    <ReceiptRow
                      label="Flat / House No."
                      value={result.flat_no}
                    />

                    <ReceiptRow
                      label="Mobile"
                      value={result.mobile}
                    />

                    <ReceiptRow
                      label="Payment Method"
                      value={result.payment_method}
                    />

                    <ReceiptRow
                      label="Collected By"
                      value={result.collector_name}
                      last
                    />
                  </div>
                </div>

                {/* Amount */}

                <div className="mt-6 overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Vargani Amount
                      </p>

                      <p className="mt-2 text-3xl font-black sm:text-4xl">
                        {formatINR(
                          Number(result.amount),
                        ).replace("₹", "Rs. ")}
                      </p>
                    </div>

                    <div className="sm:max-w-[48%] sm:text-right">
                      <p className="text-xs uppercase tracking-wider opacity-70">
                        Amount in Words
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-5">
                        {amountInWords(
                          Number(result.amount),
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-11"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>

                  <Button
                    className="h-11"
                    variant="outline"
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4" />
                    Print Pauti
                  </Button>
                </div>

                {/* New Search */}

                <button
                  type="button"
                  onClick={resetLookup}
                  className="mx-auto mt-5 block text-sm font-semibold text-primary hover:underline"
                >
                  Check another Pauti
                </button>
              </div>
            </div>

            {/* Footer Info */}

            <div className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              <p>
                This digital receipt was generated by Digital
                Vargani.
              </p>

              {result.mandal_phone ? (
                <p className="mt-1">
                  For any issue with this receipt, contact the
                  Mandal at {result.mandal_phone}.
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
          Digital Vargani · Ganpati Mandal Management
        </div>
      </footer>
    </main>
  );
}

/* ===========================================================
   RECEIPT ROW
=========================================================== */

function ReceiptRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[140px_1fr] px-4 py-3 text-sm sm:grid-cols-[180px_1fr] ${
        last ? "" : "border-b"
      }`}
    >
      <span className="font-semibold text-muted-foreground">
        {label}
      </span>

      <span className="break-words font-semibold">
        {value || "—"}
      </span>
    </div>
  );
}

/* ===========================================================
   AMOUNT IN WORDS
=========================================================== */

function amountInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "—";
  }

  const value = Math.round(amount);

  return `${convertIndianNumber(value)} Rupees Only`;
}

function convertIndianNumber(value: number): string {
  if (value === 0) {
    return "Zero";
  }

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const belowThousand = (n: number): string => {
    let text = "";

    if (n >= 100) {
      text += `${ones[Math.floor(n / 100)]} Hundred`;
      n %= 100;

      if (n > 0) {
        text += " ";
      }
    }

    if (n >= 20) {
      text += tens[Math.floor(n / 10)];
      n %= 10;

      if (n > 0) {
        text += ` ${ones[n]}`;
      }
    } else if (n > 0) {
      text += ones[n];
    }

    return text;
  };

  const parts: string[] = [];

  let remaining = value;

  const crore = Math.floor(
    remaining / 10000000,
  );

  remaining %= 10000000;

  const lakh = Math.floor(
    remaining / 100000,
  );

  remaining %= 100000;

  const thousand = Math.floor(
    remaining / 1000,
  );

  remaining %= 1000;

  if (crore) {
    parts.push(
      `${belowThousand(crore)} Crore`,
    );
  }

  if (lakh) {
    parts.push(
      `${belowThousand(lakh)} Lakh`,
    );
  }

  if (thousand) {
    parts.push(
      `${belowThousand(thousand)} Thousand`,
    );
  }

  if (remaining) {
    parts.push(
      belowThousand(remaining),
    );
  }

  return parts.join(" ");
}