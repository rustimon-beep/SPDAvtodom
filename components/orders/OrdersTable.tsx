"use client";

import { Fragment } from "react";
import { STATUS_OPTIONS } from "../../lib/orders/constants";
import type { OrderItem, OrderWithItems, UserProfile } from "../../lib/orders/types";
import {
  formatDate,
  formatDateTimeForView,
  getOrderDeliveredDate,
  getOrderPlannedDate,
  getOrderProgress,
  getOrderStatus,
  hasComment,
  hasReplacementInOrder,
  isItemOverdue,
  isOrderOverdue,
  orderTypeClasses,
  statusClasses,
  statusSelectClasses,
} from "../../lib/orders/utils";

type OrdersTableProps = {
  loading: boolean;
  orders: OrderWithItems[];
  expandedOrders: number[];
  copiedArticle: string | null;
  user: UserProfile;
  toggleOrderExpand: (orderId: number) => void;
  openEdit: (order: OrderWithItems) => void;
  removeOrder: (id: number) => Promise<void>;
  updateItemStatusQuick: (
    orderId: number,
    item: OrderItem,
    newStatus: string
  ) => Promise<void>;
  copyArticle: (article: string | null) => Promise<void>;
};

export function OrdersTable({
  loading,
  orders,
  expandedOrders,
  copiedArticle,
  user,
  toggleOrderExpand,
  openEdit,
  removeOrder,
  updateItemStatusQuick,
  copyArticle,
}: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/95 text-slate-600 backdrop-blur">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-4 font-semibold">Заказ</th>
              <th className="px-4 py-4 font-semibold">Тип</th>
              <th className="px-4 py-4 font-semibold">Дата заказа</th>
              <th className="px-4 py-4 font-semibold">Общий статус</th>
              <th className="px-4 py-4 font-semibold">Прогресс</th>
              <th className="px-4 py-4 font-semibold">Плановая</th>
              <th className="px-4 py-4 font-semibold">Полная поставка</th>
              <th className="px-4 py-4 font-semibold">Последнее изменение</th>
            </tr>
          </thead>

          <tbody className="bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                  Загрузка...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                  Ничего не найдено.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const expanded = expandedOrders.includes(order.id);
                const items = order.order_items || [];
                const orderStatus = getOrderStatus(items);
                const overdue = isOrderOverdue(items);
                const progress = getOrderProgress(items);
                const plannedDate = getOrderPlannedDate(items);
                const fullDeliveredDate = getOrderDeliveredDate(items);
                const orderType = order.order_type || "Стандартный";

                return (
                  <Fragment key={order.id}>
                    <tr
                      className={`border-t border-slate-100 align-top transition ${
                        overdue
                          ? "bg-rose-50/40 hover:bg-rose-50/60"
                          : orderStatus === "Поставлен"
                          ? "bg-emerald-50/25 hover:bg-emerald-50/40"
                          : orderType === "Срочный"
                          ? "bg-amber-50/35 hover:bg-amber-50/50"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-10 w-1.5 rounded-full ${
                              overdue
                                ? "bg-rose-500"
                                : orderStatus === "Поставлен"
                                ? "bg-emerald-500"
                                : orderType === "Срочный"
                                ? "bg-amber-500"
                                : orderStatus === "Отменен" || orderStatus === "Частично отменен"
                                ? "bg-rose-400"
                                : orderStatus === "В пути" ||
                                  orderStatus === "Частично поставлен"
                                ? "bg-violet-500"
                                : orderStatus === "В работе"
                                ? "bg-amber-400"
                                : "bg-slate-400"
                            }`}
                          />

                          <div className="min-w-0">
                            <button
                              onClick={() => toggleOrderExpand(order.id)}
                              className="rounded-lg px-1 py-0.5 text-left transition hover:bg-white/80"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">
                                  {expanded ? "▼" : "▶"}
                                </span>
                                <span className="text-base font-semibold tracking-tight text-slate-900">
                                  {order.client_order || "Без номера"}
                                </span>
                              </div>
                            </button>

                            <div className="mt-2 flex flex-wrap gap-2">
                              {user.role !== "viewer" ? (
                                <button
                                  onClick={() => openEdit(order)}
                                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  Изменить
                                </button>
                              ) : null}

                              {user.role === "admin" ? (
                                <button
                                  onClick={() => removeOrder(order.id)}
                                  className="rounded-xl border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-50"
                                >
                                  Удалить
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${orderTypeClasses(
                              orderType
                            )}`}
                          >
                            {orderType}
                          </span>

                          {hasComment(order.comment) ? (
                            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                              Есть комментарий
                            </span>
                          ) : null}

                          {hasReplacementInOrder(items) ? (
                            <span className="inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              Есть замены
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{formatDate(order.order_date)}</td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                            orderStatus
                          )}`}
                        >
                          {orderStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex min-w-[130px] flex-col gap-2">
                          <div className="text-[11px] font-medium text-slate-700">
                            {progress.delivered}/{progress.total}
                          </div>
                          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="bg-emerald-500"
                              style={{
                                width:
                                  progress.total > 0
                                    ? `${(progress.delivered / progress.total) * 100}%`
                                    : "0%",
                              }}
                            />
                            <div
                              className="bg-rose-500"
                              style={{
                                width:
                                  progress.total > 0
                                    ? `${(progress.canceled / progress.total) * 100}%`
                                    : "0%",
                              }}
                            />
                            <div
                              className="bg-slate-300"
                              style={{
                                width:
                                  progress.total > 0
                                    ? `${(progress.active / progress.total) * 100}%`
                                    : "0%",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-700">{formatDate(plannedDate)}</td>

                      <td className="px-4 py-4 text-slate-700">
                        {formatDate(fullDeliveredDate)}
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {order.updated_at ? (
                          <div className="max-w-[150px]">
                            <div className="truncate text-xs font-medium text-slate-700">
                              {order.updated_by || "—"}
                            </div>
                            <div className="mt-1 text-[11px]">
                              {formatDateTimeForView(order.updated_at)}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>

                    {expanded ? (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={8} className="px-4 pt-0 pb-2">
                          <div className="mb-1 mt-0 flex items-center justify-end">
                            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                              {items.length} шт.
                            </div>
                          </div>

                          <div className="space-y-1">
                            {items.map((item) => {
                              const itemOverdue = isItemOverdue(item);

                              return (
                                <div
                                  key={item.id}
                                  className={`grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-xl border bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition md:grid-cols-[1fr_1.55fr_0.5fr_0.9fr_0.72fr_0.65fr_0.65fr] ${
                                    itemOverdue
                                      ? "border-rose-200 ring-1 ring-rose-100"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Артикул
                                    </div>
                                    <button
                                      onClick={() => copyArticle(item.article)}
                                      className="rounded-md px-1 py-0.5 text-left text-[15px] font-semibold leading-5 text-slate-900 transition hover:bg-slate-100"
                                      title="Нажми, чтобы скопировать артикул"
                                    >
                                      {item.article || "—"}
                                    </button>

                                    {item.replacement_article ? (
                                      <div className="mt-1.5 space-y-1">
                                        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700">
                                          Замена
                                        </span>
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-medium leading-4 text-amber-700">
                                          Актуальный артикул: {item.replacement_article}
                                        </div>
                                      </div>
                                    ) : null}

                                    {copiedArticle === item.article ? (
                                      <div className="mt-1 text-[9px] text-emerald-600">
                                        Скопировано
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Наименование
                                    </div>
                                    <div className="text-[14px] leading-5 text-slate-700">
                                      {item.name || "—"}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Кол-во
                                    </div>
                                    <div className="text-[14px] font-semibold leading-5 text-slate-900">
                                      {item.quantity || "—"}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Статус
                                    </div>

                                    {user.role === "viewer" ? (
                                      <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${statusClasses(
                                          item.status || "Новый"
                                        )}`}
                                      >
                                        {item.status || "Новый"}
                                      </span>
                                    ) : (
                                      <select
                                        value={item.status || "Новый"}
                                        onChange={(e) =>
                                          updateItemStatusQuick(order.id, item, e.target.value)
                                        }
                                        className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium outline-none ${statusSelectClasses(
                                          item.status || "Новый"
                                        )}`}
                                      >
                                        {STATUS_OPTIONS.map((status) => (
                                          <option key={status} value={status}>
                                            {status}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Плановая
                                    </div>
                                    <div className="text-[14px] leading-5 text-slate-700">
                                      {formatDate(item.planned_date)}
                                    </div>
                                    {itemOverdue ? (
                                      <div className="mt-1 text-[9px] font-medium text-rose-600">
                                        Просрочено
                                      </div>
                                    ) : null}
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Поставка
                                    </div>
                                    <div className="text-[14px] leading-5 text-slate-700">
                                      {formatDate(item.delivered_date)}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                      Отмена
                                    </div>
                                    <div className="text-[14px] leading-5 text-slate-700">
                                      {formatDate(item.canceled_date)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}