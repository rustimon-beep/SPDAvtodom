import type { RefObject } from "react";
import type { ItemForm } from "../../lib/orders/types";
import { ORDER_TYPE_OPTIONS, STATUS_OPTIONS } from "../../lib/orders/constants";
import { getTodayDate } from "../../lib/orders/utils";

type OrderFormModalProps = {
  open: boolean;
  saving: boolean;
  editingOrderId: number | null;
  userRole: "admin" | "supplier" | "viewer";
  form: {
    clientOrder: string;
    orderDate: string;
    orderType: string;
    comment: string;
    newComment: string;
    bulkPlannedDate: string;
    bulkStatus: string;
    items: ItemForm[];
  };
  parsedComments: {
    datetime: string;
    author: string;
    text: string;
  }[];
  fileInputRef: RefObject<HTMLInputElement>;
  canEditOrderTextFields: boolean;
  canEditItemMainFields: boolean;
  canImportItems: boolean;
  canEditItemStatusFields: boolean;
  canComment: boolean;
  setOpen: (value: boolean) => void;
  setForm: React.Dispatch<
    React.SetStateAction<{
      clientOrder: string;
      orderDate: string;
      orderType: string;
      comment: string;
      newComment: string;
      bulkPlannedDate: string;
      bulkStatus: string;
      items: ItemForm[];
    }>
  >;
  applyBulkPlannedDate: () => void;
  applyBulkStatus: () => void;
  handleExcelUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  addItemRow: () => void;
  updateItemField: (
    index: number,
    field: keyof ItemForm,
    value: string | boolean
  ) => void;
  removeItemRow: (index: number) => void;
  saveForm: () => Promise<void>;
};

export function OrderFormModal({
  open,
  saving,
  editingOrderId,
  userRole,
  form,
  parsedComments,
  fileInputRef,
  canEditOrderTextFields,
  canEditItemMainFields,
  canImportItems,
  canEditItemStatusFields,
  canComment,
  setOpen,
  setForm,
  applyBulkPlannedDate,
  applyBulkStatus,
  handleExcelUpload,
  addItemRow,
  updateItemField,
  removeItemRow,
  saveForm,
}: OrderFormModalProps) {
  if (!open) return null;

  const isEditing = !!editingOrderId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-[2px] md:flex md:items-center md:justify-center md:p-4">
      <div className="relative my-4 w-full max-w-6xl rounded-[30px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] md:my-8">
        {saving ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[30px] bg-white/75 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-7 py-6 shadow-xl">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />
              <div className="text-sm font-medium text-slate-700">Сохраняем заказ...</div>
            </div>
          </div>
        ) : null}

        <div className="border-b border-slate-200 px-5 py-5 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {editingOrderId ? "Редактирование" : "Создание"}
              </div>
              <h2 className="mt-3 pr-2 text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                {editingOrderId ? "Редактировать заказ" : "Новый заказ"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Управление реквизитами заказа, комментариями и позициями.
              </p>
            </div>

            <button
              onClick={() => !saving && setOpen(false)}
              disabled={saving}
              className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-5 md:px-6">
          <div className="space-y-6">
            <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Основная информация
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Номер клиентского заказа
                  </label>
                  <input
                    value={form.clientOrder}
                    disabled={!canEditOrderTextFields || saving}
                    onChange={(e) => setForm({ ...form, clientOrder: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Дата заказа
                  </label>
                  <input
                    type="date"
                    value={form.orderDate}
                    disabled={!canEditOrderTextFields || saving}
                    onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Тип заказа
                  </label>
                  <select
                    value={form.orderType}
                    disabled={isEditing || userRole !== "admin" || saving}
                    onChange={(e) => setForm({ ...form, orderType: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {ORDER_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {isEditing ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                      Тип заказа после создания не редактируется
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {userRole !== "viewer" ? (
              <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Массовые действия
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_auto] md:items-end">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Плановая дата для всех позиций
                        </label>
                        <input
                          type="date"
                          min={getTodayDate()}
                          value={form.bulkPlannedDate}
                          disabled={saving}
                          onChange={(e) =>
                            setForm({ ...form, bulkPlannedDate: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <button
                          onClick={applyBulkPlannedDate}
                          disabled={saving}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Применить ко всем позициям
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[240px_auto] md:items-end">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Статус для всех позиций
                        </label>
                        <select
                          value={form.bulkStatus}
                          disabled={saving}
                          onChange={(e) =>
                            setForm({ ...form, bulkStatus: e.target.value })
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <button
                          onClick={applyBulkStatus}
                          disabled={saving}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Применить статус ко всем
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Комментарии
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    История комментариев
                  </label>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
                    {parsedComments.length === 0 ? (
                      <div className="text-sm text-slate-500">Комментариев пока нет</div>
                    ) : (
                      parsedComments.map((entry, index) => (
                        <div
                          key={`${entry.datetime}-${entry.author}-${index}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-slate-800">
                              {entry.author}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {entry.datetime}
                            </div>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {entry.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Новый комментарий
                  </label>
                  <textarea
                    value={form.newComment}
                    disabled={!canComment || saving}
                    onChange={(e) => setForm({ ...form, newComment: e.target.value })}
                    className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Позиции заказа
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Управление артикулами, статусами и заменами.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isEditing && canImportItems ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Импорт Excel
                      </button>
                    </>
                  ) : null}

                  {!isEditing && userRole === "admin" ? (
                    <button
                      onClick={addItemRow}
                      disabled={saving}
                      className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Добавить позицию
                    </button>
                  ) : null}
                </div>
              </div>

              {!isEditing ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  Для Excel используй колонки: <b>Артикул</b>, <b>Наименование</b>, <b>Количество</b>
                </div>
              ) : null}

              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={item.id || `new-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1.45fr_0.55fr_0.85fr_0.85fr]">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Артикул
                        </label>
                        <input
                          value={item.article}
                          disabled={!canEditItemMainFields || saving}
                          onChange={(e) => updateItemField(index, "article", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Наименование
                        </label>
                        <input
                          value={item.name}
                          disabled={!canEditItemMainFields || saving}
                          onChange={(e) => updateItemField(index, "name", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Кол-во
                        </label>
                        <input
                          value={item.quantity}
                          disabled={!canEditItemMainFields || saving}
                          onChange={(e) => updateItemField(index, "quantity", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Плановая
                        </label>
                        <input
                          type="date"
                          min={getTodayDate()}
                          value={item.plannedDate}
                          disabled={!canEditItemStatusFields || saving}
                          onChange={(e) => updateItemField(index, "plannedDate", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Статус
                        </label>
                        <select
                          value={item.status}
                          disabled={!canEditItemStatusFields || saving}
                          onChange={(e) => updateItemField(index, "status", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
                      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.hasReplacement}
                          disabled={!canEditItemStatusFields || saving}
                          onChange={(e) =>
                            updateItemField(index, "hasReplacement", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Есть замена
                      </label>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Актуальный артикул
                        </label>
                        <input
                          value={item.replacementArticle}
                          disabled={
                            !canEditItemStatusFields ||
                            !item.hasReplacement ||
                            saving
                          }
                          onChange={(e) =>
                            updateItemField(index, "replacementArticle", e.target.value)
                          }
                          placeholder="Укажи актуальный артикул"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div className="flex items-end">
                        {userRole === "admin" && !isEditing ? (
                          <button
                            onClick={() => removeItemRow(index)}
                            disabled={saving}
                            className="w-full rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                          >
                            Удалить
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end md:px-6">
          <button
            onClick={() => !saving && setOpen(false)}
            disabled={saving}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Отмена
          </button>
          <button
            onClick={saveForm}
            disabled={saving}
            className="w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
