import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { $api } from "src/api/query";

dayjs.extend(utc);

const useConsumptionInvoices = (enabled = false) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/invoice",
    { headers: { "x-ignore-global-error": true } },
    {
      enabled,
      select: (data) => {
        const invoices = data.invoices || [];
        const updatedInvoices = invoices.map((invoice) => {
          const status = invoice.invoiceStatus;
          const dueDate = invoice.dueDate;
          let isPastDueDate = false;
          if (dueDate && status) {
            isPastDueDate = status === "open" && dayjs.utc().isAfter(dayjs.utc(dueDate));
          }
          const invoiceCopy = { ...invoice };
          if (isPastDueDate) {
            invoiceCopy.invoiceStatus = "pastDue";
          }
          return invoiceCopy;
        });

        return {
          invoices: updatedInvoices,
        };
      },
    }
  );

  return query;
};

export default useConsumptionInvoices;
