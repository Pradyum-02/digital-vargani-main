import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  amountInWords,
  formatDate,
} from "@/lib/format";

import type {
  AppData,
  Collection,
} from "@/types";

import {
  expenseByCategory,
  financialTotals,
  summaryFor,
} from "./selectors";

/* =========================================================
   RECEIPT COLORS
========================================================= */

const SAFFRON: [number, number, number] = [
  232,
  105,
  0,
];

const DARK: [number, number, number] = [
  31,
  41,
  55,
];

const MUTED: [number, number, number] = [
  107,
  114,
  128,
];

const BORDER: [number, number, number] = [
  224,
  226,
  230,
];

const LIGHT: [number, number, number] = [
  248,
  249,
  250,
];

const WHITE: [number, number, number] = [
  255,
  255,
  255,
];

/* =========================================================
   HELPERS
========================================================= */

function rupees(amount: number): string {
  /*
   * jsPDF's default Helvetica font does not reliably
   * render the ₹ glyph. "Rs." keeps the PDF clean.
   */
  return `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;
}

function safeText(
  value: string | undefined | null,
): string {
  return value?.trim() || "—";
}

/* =========================================================
   PAUTI CONTEXT
========================================================= */

export interface PautiContext {
  collection: Collection;
  data: AppData;
}

/* =========================================================
   PAUTI PDF
========================================================= */

export function buildPautiDoc({
  collection,
  data,
}: PautiContext): jsPDF {
  const doc = new jsPDF({
    unit: "pt",
    format: "a5",
    orientation: "portrait",
  });

  const { mandal } = data;

  const summary = summaryFor(
    data,
    collection.householdId,
  );

  const household =
    summary?.household;

  const collector =
    data.collectors.find(
      (c) =>
        c.id ===
        collection.collectorId,
    );

  const W =
    doc.internal.pageSize.getWidth();

  const H =
    doc.internal.pageSize.getHeight();

  const M = 28;

  /* =======================================================
     HEADER
  ======================================================= */

  doc.setFillColor(...SAFFRON);

  doc.roundedRect(
    0,
    0,
    W,
    82,
    0,
    0,
    "F",
  );

  /*
   * Small Ganpati mark.
   */

  doc.setFillColor(
    255,
    255,
    255,
  );

  doc.circle(
    M + 17,
    30,
    15,
    "F",
  );

  doc.setTextColor(
    ...SAFFRON,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(14);

  doc.text(
    "VR",
    M + 17,
    35,
    {
      align: "center",
    },
  );

  /*
   * Mandal name.
   */

  doc.setTextColor(
    ...WHITE,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(14);

  doc.text(
    safeText(mandal.name),
    M + 40,
    27,
  );

  /*
   * Address.
   */

  if (mandal.address?.trim()) {
    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.text(
      mandal.address,
      M + 40,
      40,
      {
        maxWidth:
          W - M * 2 - 50,
      },
    );
  }

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(8);

  doc.text(
    `Ph: ${safeText(mandal.phone)}  |  Ganeshotsav ${mandal.year}`,
    M + 40,
    57,
  );

  /*
   * Header right label.
   */

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(7);

  doc.text(
    "DIGITAL VARGANI",
    W - M,
    28,
    {
      align: "right",
    },
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(6.5);

  doc.text(
    "Official Collection Receipt",
    W - M,
    40,
    {
      align: "right",
    },
  );

  /* =======================================================
     RECEIPT TITLE
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(14);

  doc.text(
    "VARGANI RECEIPT",
    W / 2,
    108,
    {
      align: "center",
    },
  );

  doc.setTextColor(...MUTED);

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7.5);

  doc.text(
    "PAUTI / CONTRIBUTION RECEIPT",
    W / 2,
    120,
    {
      align: "center",
    },
  );

  /*
   * Accent line.
   */

  doc.setDrawColor(...SAFFRON);

  doc.setLineWidth(2);

  doc.line(
    W / 2 - 35,
    128,
    W / 2 + 35,
    128,
  );

  doc.setLineWidth(1);

  /* =======================================================
     PAUTI NUMBER + DATE
  ======================================================= */

  const metaY = 151;

  /*
   * Pauti number box.
   */

  doc.setFillColor(...LIGHT);

  doc.setDrawColor(...BORDER);

  doc.roundedRect(
    M,
    metaY,
    150,
    38,
    7,
    7,
    "FD",
  );

  doc.setTextColor(...MUTED);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(7);

  doc.text(
    "PAUTI NUMBER",
    M + 10,
    metaY + 13,
  );

  doc.setTextColor(...DARK);

  doc.setFontSize(10);

  doc.text(
    collection.pautiNo,
    M + 10,
    metaY + 28,
  );

  /*
   * Date box.
   */

  doc.setFillColor(...LIGHT);

  doc.roundedRect(
    W - M - 150,
    metaY,
    150,
    38,
    7,
    7,
    "FD",
  );

  doc.setTextColor(...MUTED);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(7);

  doc.text(
    "DATE",
    W - M - 140,
    metaY + 13,
  );

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(9);

  doc.text(
    formatDate(collection.date),
    W - M - 140,
    metaY + 28,
  );

  /* =======================================================
     RESIDENT DETAILS
  ======================================================= */

  const detailsY = 207;

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(9);

  doc.text(
    "CONTRIBUTOR DETAILS",
    M,
    detailsY,
  );

  doc.setDrawColor(...BORDER);

  doc.line(
    M,
    detailsY + 7,
    W - M,
    detailsY + 7,
  );

  const rows: Array<
    [string, string]
  > = [
    [
      "Resident Name",
      safeText(
        household?.residentName,
      ),
    ],

    [
      "Flat / House No.",
      safeText(
        household?.flatNo,
      ),
    ],

    [
      "Mobile",
      safeText(
        household?.mobile,
      ),
    ],

    [
      "Payment Method",
      collection.method,
    ],

    [
      "Collected By",
      safeText(
        collector?.name,
      ),
    ],
  ];

  autoTable(doc, {
    startY: detailsY + 17,

    margin: {
      left: M,
      right: M,
    },

    theme: "grid",

    styles: {
      font:
        "helvetica",

      fontSize: 8.5,

      cellPadding: 6,

      textColor: DARK,

      lineColor: BORDER,

      lineWidth: 0.6,

      valign: "middle",
    },

    columnStyles: {
      0: {
        cellWidth: 105,
        fontStyle: "bold",
        textColor: MUTED,
        fillColor: LIGHT,
      },

      1: {
        cellWidth:
          W - M * 2 - 105,
      },
    },

    body: rows,
  });

  /* =======================================================
     AMOUNT HIGHLIGHT
  ======================================================= */

  const tableEnd =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY;

  const amountY =
    tableEnd + 18;

  doc.setFillColor(
    ...SAFFRON,
  );

  doc.roundedRect(
    M,
    amountY,
    W - M * 2,
    67,
    9,
    9,
    "F",
  );

  doc.setTextColor(
    ...WHITE,
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8);

  doc.text(
    "VARGANI AMOUNT",
    M + 14,
    amountY + 17,
  );

  doc.setFontSize(21);

  doc.text(
    rupees(collection.amount),
    M + 14,
    amountY + 42,
  );

  /*
   * Amount in words.
   */

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7);

  doc.text(
    amountInWords(
      collection.amount,
    ),
    W - M - 14,
    amountY + 40,
    {
      align: "right",
      maxWidth: 170,
    },
  );

  /* =======================================================
     NOTES
  ======================================================= */

  let footerStart =
    amountY + 88;

  if (collection.notes) {
    doc.setTextColor(...DARK);

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(8);

    doc.text(
      "NOTES",
      M,
      footerStart,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(...MUTED);

    doc.text(
      collection.notes,
      M,
      footerStart + 13,
      {
        maxWidth:
          W - M * 2,
      },
    );

    footerStart += 32;
  }

  /* =======================================================
     THANK YOU
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(9.5);

  doc.text(
    "Thank you for your contribution.",
    W / 2,
    footerStart,
    {
      align: "center",
    },
  );

  doc.setTextColor(...SAFFRON);

  doc.setFontSize(11);

  doc.text(
    "|| Ganpati Bappa Morya ||",
    W / 2,
    footerStart + 17,
    {
      align: "center",
    },
  );

  /* =======================================================
     FOOTER / SIGNATURE
  ======================================================= */

  const signatureY =
    H - 64;

  /*
   * Footer divider.
   */

  doc.setDrawColor(...BORDER);

  doc.line(
    M,
    signatureY - 14,
    W - M,
    signatureY - 14,
  );

  /*
   * Computer generated note.
   */

  doc.setTextColor(...MUTED);

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(6.5);

  doc.text(
    mandal.receiptFooter?.trim() ||
      "This is a computer generated receipt.",
    M,
    signatureY,
    {
      maxWidth:
        W / 2 - 10,
    },
  );

  /*
   * Signature.
   */

  doc.setDrawColor(
    170,
    170,
    170,
  );

  doc.line(
    W - M - 105,
    signatureY - 3,
    W - M,
    signatureY - 3,
  );

  doc.setFontSize(7);

  doc.text(
    "Authorised Signatory",
    W - M - 52.5,
    signatureY + 9,
    {
      align: "center",
    },
  );

  /*
   * Bottom branding.
   */

  doc.setTextColor(...SAFFRON);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(6.5);

  doc.text(
    "DIGITAL VARGANI",
    W / 2,
    H - 18,
    {
      align: "center",
    },
  );

  return doc;
}

/* =========================================================
   PAUTI DOWNLOAD
========================================================= */

export function downloadPauti(
  ctx: PautiContext,
) {
  buildPautiDoc(ctx).save(
    `${ctx.collection.pautiNo}.pdf`,
  );
}

/* =========================================================
   PAUTI PRINT
========================================================= */

export function printPauti(
  ctx: PautiContext,
) {
  const doc =
    buildPautiDoc(ctx);

  doc.autoPrint();

  const url =
    doc.output("bloburl");

  window.open(
    url as unknown as string,
    "_blank",
  );
}

/* =========================================================
   PAUTI BLOB
========================================================= */

export function pautiBlob(
  ctx: PautiContext,
): Blob {
  return buildPautiDoc(
    ctx,
  ).output("blob");
}

/* =========================================================
   PAUTI DATA URL
========================================================= */

export function pautiDataUrl(
  ctx: PautiContext,
): string {
  return buildPautiDoc(
    ctx,
  ).output(
    "dataurlstring",
  );
}

/* =========================================================
   FINAL HISHOB REPORT
========================================================= */

export function buildHishobDoc(
  data: AppData,
): jsPDF {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: "portrait",
  });

  const t =
    financialTotals(data);

  const categories =
    expenseByCategory(data);

  const W =
    doc.internal.pageSize.getWidth();

  const H =
    doc.internal.pageSize.getHeight();

  const M = 40;

  const contentW =
    W - M * 2;

  /* =======================================================
     PAGE FOOTER
  ======================================================= */

  const pageFooter = (
    pageNumber: number,
  ) => {
    doc.setDrawColor(...BORDER);

    doc.setLineWidth(0.6);

    doc.line(
      M,
      H - 34,
      W - M,
      H - 34,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7);

    doc.setTextColor(...MUTED);

    doc.text(
      `Digital Vargani · ${data.mandal.name} · Ganeshotsav ${data.mandal.year}`,
      M,
      H - 20,
    );

    doc.text(
      `Page ${pageNumber}`,
      W - M,
      H - 20,
      {
        align: "right",
      },
    );
  };

  /* =======================================================
     HEADER
  ======================================================= */

  doc.setFillColor(...DARK);

  doc.rect(
    0,
    0,
    W,
    82,
    "F",
  );

  doc.setTextColor(...WHITE);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(19);

  doc.text(
    "FINAL GANPATI HISHOB",
    M,
    31,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(10.5);

  doc.text(
    `${safeText(data.mandal.name)} · Ganeshotsav ${data.mandal.year}`,
    M,
    50,
  );

  if (data.mandal.address?.trim()) {
    doc.setFontSize(8);

    doc.text(
      data.mandal.address,
      M,
      65,
      {
        maxWidth:
          contentW - 100,
      },
    );
  }

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8);

  doc.text(
    "OFFICIAL HISHOB",
    W - M,
    31,
    {
      align: "right",
    },
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7);

  doc.text(
    "Financial Statement",
    W - M,
    44,
    {
      align: "right",
    },
  );

  /* =======================================================
     FINANCIAL SUMMARY
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(12);

  doc.text(
    "FINANCIAL SUMMARY",
    M,
    108,
  );

  doc.setDrawColor(...SAFFRON);

  doc.setLineWidth(2);

  doc.line(
    M,
    115,
    M + 72,
    115,
  );

  doc.setLineWidth(1);

  autoTable(doc, {
    startY: 128,

    margin: {
      left: M,
      right: M,
    },

    theme: "grid",

    head: [
      [
        "Particulars",
        "Value",
      ],
    ],

    headStyles: {
      fillColor: SAFFRON,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.5,
    },

    columnStyles: {
      0: {
        cellWidth:
          contentW * 0.68,
      },

      1: {
        cellWidth:
          contentW * 0.32,
        halign: "right",
      },
    },

    body: [
      [
        "Total Households",
        String(
          t.totalHouseholds,
        ),
      ],

      [
        "Contributors",
        String(
          t.contributors,
        ),
      ],

      [
        "Pending Vargani",
        rupees(
          t.pendingAmount,
        ),
      ],
    ],
  });

  let y =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY +
    22;

  /* =======================================================
     INCOME
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(12);

  doc.text(
    "INCOME",
    M,
    y,
  );

  doc.setDrawColor(...SAFFRON);

  doc.setLineWidth(2);

  doc.line(
    M,
    y + 7,
    M + 40,
    y + 7,
  );

  doc.setLineWidth(1);

  autoTable(doc, {
    startY:
      y + 20,

    margin: {
      left: M,
      right: M,
    },

    theme: "grid",

    head: [
      [
        "Income Source",
        "Amount",
      ],
    ],

    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.5,
    },

    columnStyles: {
      0: {
        cellWidth:
          contentW * 0.68,
      },

      1: {
        cellWidth:
          contentW * 0.32,
        halign: "right",
      },
    },

    body: [
      [
        "Vargani Collection",
        rupees(
          t.totalCollection,
        ),
      ],

      [
        "Sponsorship",
        rupees(
          t.sponsorship,
        ),
      ],

      [
        "Other Income",
        rupees(
          t.otherIncome,
        ),
      ],
    ],

    foot: [
      [
        "TOTAL INCOME",
        rupees(
          t.totalIncome,
        ),
      ],
    ],

    footStyles: {
      fillColor: LIGHT,
      textColor: DARK,
      fontStyle: "bold",
    },
  });

  y =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY +
    22;

  /* =======================================================
     VARGANI PAYMENT BREAKDOWN
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(12);

  doc.text(
    "VARGANI PAYMENT BREAKDOWN",
    M,
    y,
  );

  doc.setDrawColor(...SAFFRON);

  doc.setLineWidth(2);

  doc.line(
    M,
    y + 7,
    M + 135,
    y + 7,
  );

  doc.setLineWidth(1);

  autoTable(doc, {
    startY:
      y + 20,

    margin: {
      left: M,
      right: M,
    },

    theme: "striped",

    head: [
      [
        "Payment Method",
        "Amount",
      ],
    ],

    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5.5,
      textColor: DARK,
    },

    columnStyles: {
      0: {
        cellWidth:
          contentW * 0.68,
      },

      1: {
        cellWidth:
          contentW * 0.32,
        halign: "right",
      },
    },

    body: [
      [
        "UPI",
        rupees(
          t.byMethod.UPI,
        ),
      ],

      [
        "Cash",
        rupees(
          t.byMethod.CASH,
        ),
      ],

      [
        "Bank Transfer",
        rupees(
          t.byMethod.BANK,
        ),
      ],

      [
        "Cheque",
        rupees(
          t.byMethod.CHEQUE,
        ),
      ],
    ],
  });

  y =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY +
    22;

  /* =======================================================
     EXPENSES
  ======================================================= */

  doc.setTextColor(...DARK);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(12);

  doc.text(
    "EXPENSES",
    M,
    y,
  );

  doc.setDrawColor(...SAFFRON);

  doc.setLineWidth(2);

  doc.line(
    M,
    y + 7,
    M + 58,
    y + 7,
  );

  doc.setLineWidth(1);

  autoTable(doc, {
    startY:
      y + 20,

    margin: {
      left: M,
      right: M,
    },

    theme: "striped",

    head: [
      [
        "Expense Category",
        "Amount",
      ],
    ],

    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 9,
    },

    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 5.5,
      textColor: DARK,
    },

    columnStyles: {
      0: {
        cellWidth:
          contentW * 0.68,
      },

      1: {
        cellWidth:
          contentW * 0.32,
        halign: "right",
      },
    },

    body: categories.map(
      (e) => [
        safeText(
          e.category,
        ),

        rupees(
          e.amount,
        ),
      ],
    ),

    foot: [
      [
        "TOTAL EXPENSES",
        rupees(
          t.totalExpenses,
        ),
      ],
    ],

    footStyles: {
      fillColor: LIGHT,
      textColor: DARK,
      fontStyle: "bold",
    },

    didDrawPage: (
      hookData,
    ) => {
      pageFooter(
        hookData.pageNumber,
      );
    },
  });

  y =
    (
      doc as unknown as {
        lastAutoTable: {
          finalY: number;
        };
      }
    ).lastAutoTable.finalY +
    26;

  /* =======================================================
     CLOSING BALANCE
  ======================================================= */

  if (y > H - 125) {
    doc.addPage();

    y = 55;
  }

  doc.setFillColor(...DARK);

  doc.roundedRect(
    M,
    y,
    contentW,
    76,
    9,
    9,
    "F",
  );

  doc.setTextColor(...WHITE);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(9);

  doc.text(
    "CLOSING BALANCE",
    M + 16,
    y + 20,
  );

  doc.setFontSize(22);

  doc.text(
    rupees(
      t.balance,
    ),
    M + 16,
    y + 50,
  );

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(8);

  doc.text(
    "Total income minus total expenses",
    W - M - 16,
    y + 28,
    {
      align: "right",
    },
  );

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(8.5);

  doc.text(
    `Pending Vargani: ${rupees(
      t.pendingAmount,
    )}`,
    W - M - 16,
    y + 45,
    {
      align: "right",
    },
  );

  /* =======================================================
     FINAL MESSAGE
  ======================================================= */

  const messageY =
    y + 105;

  doc.setTextColor(...SAFFRON);

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(13);

  doc.text(
    "|| Ganpati Bappa Morya ||",
    W / 2,
    messageY,
    {
      align: "center",
    },
  );

  doc.setTextColor(...MUTED);

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(7.5);

  doc.text(
    "This is a computer generated financial statement.",
    W / 2,
    messageY + 16,
    {
      align: "center",
    },
  );

  pageFooter(
    doc.getNumberOfPages(),
  );

  return doc;
}

/* =========================================================
   HISHOB DOWNLOAD
========================================================= */

export function downloadHishob(
  data: AppData,
) {
  buildHishobDoc(data).save(
    `Final-Hishob-${data.mandal.year}.pdf`,
  );
}

/* =========================================================
   HISHOB PRINT
========================================================= */

export function printHishob(
  data: AppData,
) {
  const doc =
    buildHishobDoc(data);

  doc.autoPrint();

  window.open(
    doc.output(
      "bloburl",
    ) as unknown as string,
    "_blank",
  );
}

/* =========================================================
   CSV EXPORT
========================================================= */

export function downloadCSV(
  filename: string,
  rows: Array<
    Array<string | number>
  >,
) {
  const csv = rows
    .map((row) =>
      row
        .map(
          (cell) =>
            `"${String(cell).replace(
              /"/g,
              '""',
            )}"`,
        )
        .join(","),
    )
    .join("\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type: "text/csv;charset=utf-8;",
    },
  );

  const url =
    URL.createObjectURL(
      blob,
    );

  const a =
    document.createElement(
      "a",
    );

  a.href = url;

  a.download =
    filename;

  a.click();

  URL.revokeObjectURL(
    url,
  );
}