"use client";

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import PDFIcon from "app/(dashboard)/components/Icons/PDFIcon";

import DataTable from "src/components/DataTable/DataTable";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import StatusChip from "src/components/StatusChip/StatusChip";

import { sampleInvoices } from "../constants";

const columnHelper = createColumnHelper<any>();

const InvoicesTableHeader = () => {
  return (
    <div className="py-5 px-6 flex items-center justify-between gap-8">
      <DataGridHeaderTitle title="Invoices" />
    </div>
  );
};

const InvoiceTable = () => {
  const isLoadingInvoices = false;

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor("pastDue", {
        id: "pastDue",
        header: "Past Due",
      }),
      columnHelper.accessor("invoiceStatus", {
        id: "invoiceStatus",
        header: "Invoice Status",
        cell: (data) => <StatusChip category="success" status={data.row.original.invoiceStatus} />,
      }),
      columnHelper.accessor("dueDate", {
        id: "dueDate",
        header: "Due Date",
      }),
      columnHelper.accessor("invoiceDate", {
        id: "invoiceDate",
        header: "Invoice Date",
      }),
      columnHelper.accessor("amount", {
        id: "amount",
        header: "Amount",
      }),
      columnHelper.accessor("amountPaid", {
        id: "amountPaid",
        header: "Amount Paid",
      }),
      columnHelper.accessor("paymentTerm", {
        id: "paymentTerm",
        header: "Payment Term",
      }),
      columnHelper.accessor("download", {
        id: "download",
        header: "Download",
        cell: () => (
          <div className="cursor-pointer">
            <PDFIcon />
          </div>
        ),
      }),
    ];
  }, []);

  return (
    <div>
      <DataTable
        columns={dataTableColumns}
        rows={sampleInvoices}
        noRowsText="No invoices"
        HeaderComponent={InvoicesTableHeader}
        headerProps={{}}
        isLoading={isLoadingInvoices}
        selectionMode="none"
        minHeight={290}
      />
    </div>
  );
};

export default InvoiceTable;
