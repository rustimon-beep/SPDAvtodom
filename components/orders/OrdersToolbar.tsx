import { StatCard } from "./StatCard";
import type { SortDirection, SortField } from "../../lib/orders/types";

type OrdersToolbarProps = {
  stats: {
    total: number;
    inProgress: number;
    delivered: number;
    overdue: number;
  };
  search: string;
  setSearch: (value: string) => void;
  orderTypeFilter: string;
  setOrderTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  setSortField: (value: SortField) => void;
  setSortDirection: (value: SortDirection) => void;
};

export function OrdersToolbar({
  stats,
  search,
  setSearch,
  orderTypeFilter,
  setOrderTypeFilter,
  statusFilter,
  setStatusFilter,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
}: OrdersToolbarProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Всего заказов" value={stats.total} accent="slate" />
        <StatCard title="В работе" value={stats.inProgress} accent="amber" />
        <StatCard title="Поставлено" value={stats.delivered} accent="emerald" />
        <StatCard title="Просрочено" value={stats.overdue} accent="rose" />
      </div>

      <div className="rounded-[28px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 md:p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Поиск и фильтрация
            </h2>
            <p className="text-sm text-slate-500">
              Отфильтруй заказы по типу, статусу или отсортируй по нужному признаку.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по номеру заказа, типу заказа, артикулу, замене, наименованию"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
            />
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="all">Все типы</option>
              <option value="Стандартный">Стандартный</option>
              <option value="Срочный">Срочный</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="all">Все статусы</option>
              {[
                "Новый",
                "В работе",
                "В пути",
                "Поставлен",
                "Отменен",
                "Частично поставлен",
                "Частично отменен",
              ].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={`${sortField}:${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split(":") as [
                  SortField,
                  SortDirection
                ];
                setSortField(field);
                setSortDirection(direction);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
            >
              <option value="id:desc">Сначала новые</option>
              <option value="id:asc">Сначала старые</option>
              <option value="order_date:asc">Дата заказа ↑</option>
              <option value="order_date:desc">Дата заказа ↓</option>
              <option value="order_type:asc">Тип А-Я</option>
              <option value="order_type:desc">Тип Я-А</option>
              <option value="status:asc">Статус А-Я</option>
              <option value="status:desc">Статус Я-А</option>
              <option value="client_order:asc">№ заказа А-Я</option>
              <option value="client_order:desc">№ заказа Я-А</option>
              <option value="progress:desc">Больше поставлено</option>
              <option value="progress:asc">Меньше поставлено</option>
              <option value="updated_at:desc">Свежее изменение</option>
              <option value="updated_at:asc">Старое изменение</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}