"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../lib/supabase";
import { LoginForm } from "../components/orders/LoginForm";
import { OrderFormModal } from "../components/orders/OrderFormModal";
import { OrdersTable } from "../components/orders/OrdersTable";
import { OrdersToolbar } from "../components/orders/OrdersToolbar";
import { EMPTY_ITEM } from "../lib/orders/constants";
import type {
  ItemForm,
  OrderItem,
  OrderWithItems,
  SortDirection,
  SortField,
  UserProfile,
} from "../lib/orders/types";
import {
  appendCommentEntries,
  buildCommentEntry,
  compareValues,
  createEmptyOrderForm,
  formatDate,
  formatDateTimeForDb,
  getOrderProgress,
  getOrderStatus,
  getTodayDate,
  isOrderOverdue,
  mergeComments,
  parseComments,
  parseExcelItems,
} from "../lib/orders/utils";

const EMPTY_ORDER_FORM = createEmptyOrderForm(EMPTY_ITEM);

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_ORDER_FORM);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedArticle, setCopiedArticle] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [user, setUser] = useState<UserProfile | null>(null);

  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");

  const isEditing = !!editingOrderId;
  const parsedComments = useMemo(() => parseComments(form.comment), [form.comment]);

  useEffect(() => {
    if (!copiedArticle) return;
    const timer = setTimeout(() => setCopiedArticle(null), 1500);
    return () => clearTimeout(timer);
  }, [copiedArticle]);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const cacheKey = `profile-${userId}`;

    try {
      const cached =
        typeof window !== "undefined" ? window.localStorage.getItem(cacheKey) : null;

      if (cached) {
        const parsed = JSON.parse(cached) as UserProfile;

        setTimeout(async () => {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, email, full_name, role")
            .eq("id", userId)
            .single();

          if (!error && data && typeof window !== "undefined") {
            const freshProfile: UserProfile = {
              id: data.id,
              email: data.email,
              role: data.role,
              name: data.full_name,
            };
            window.localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
          }
        }, 0);

        return parsed;
      }
    } catch (e) {
      console.error("Ошибка чтения кэша профиля:", e);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Ошибка профиля:", error);
      return null;
    }

    const profile: UserProfile = {
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.full_name,
    };

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(cacheKey, JSON.stringify(profile));
      }
    } catch (e) {
      console.error("Ошибка записи кэша профиля:", e);
    }

    return profile;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      setAuthLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(false);
      setProfileLoading(true);

      const profile = await fetchProfile(session.user.id);

      if (!mounted) return;

      setUser(profile);
      setProfileLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      const profile = await fetchProfile(session.user.id);

      if (!mounted) return;

      setUser(profile);
      setProfileLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders_v2")
      .select("*, order_items(*)")
      .order("id", { ascending: false });

    if (error) {
      console.error("Ошибка загрузки:", error);
      alert("Ошибка загрузки: " + error.message);
    } else {
      setOrders((data as OrderWithItems[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const items = order.order_items || [];
      const itemsText = items
        .map(
          (item) =>
            `${item.article || ""} ${item.replacement_article || ""} ${item.name || ""} ${item.status || ""}`
        )
        .join(" ")
        .toLowerCase();

      const orderStatus = getOrderStatus(items);
      const text =
        `${order.client_order || ""} ${order.order_type || ""} ${itemsText}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : orderStatus === statusFilter;
      const matchesType =
        orderTypeFilter === "all" ? true : (order.order_type || "Стандартный") === orderTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    return [...filtered].sort((a, b) => {
      const aItems = a.order_items || [];
      const bItems = b.order_items || [];
      const aStatus = getOrderStatus(aItems);
      const bStatus = getOrderStatus(bItems);
      const aProgress = getOrderProgress(aItems).delivered;
      const bProgress = getOrderProgress(bItems).delivered;

      switch (sortField) {
        case "id":
          return compareValues(a.id, b.id, sortDirection);
        case "client_order":
          return compareValues(a.client_order, b.client_order, sortDirection);
        case "order_date":
          return compareValues(a.order_date, b.order_date, sortDirection);
        case "order_type":
          return compareValues(a.order_type, b.order_type, sortDirection);
        case "status":
          return compareValues(aStatus, bStatus, sortDirection);
        case "updated_at":
          return compareValues(a.updated_at, b.updated_at, sortDirection);
        case "progress":
          return compareValues(aProgress, bProgress, sortDirection);
        default:
          return 0;
      }
    });
  }, [orders, search, statusFilter, orderTypeFilter, sortField, sortDirection]);

  const stats = useMemo(() => {
    return {
      total: orders.length,
      inProgress: orders.filter((order) =>
        ["Новый", "В работе", "В пути", "Частично поставлен", "Частично отменен"].includes(
          getOrderStatus(order.order_items || [])
        )
      ).length,
      delivered: orders.filter(
        (order) => getOrderStatus(order.order_items || []) === "Поставлен"
      ).length,
      overdue: orders.filter((order) => isOrderOverdue(order.order_items || [])).length,
    };
  }, [orders]);

  const login = async () => {
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.login.trim(),
      password: loginForm.password.trim(),
    });

    if (error) {
      setLoginError("Неверный email или пароль");
      return;
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoginError("Не удалось получить пользователя");
      return;
    }

    setProfileLoading(true);
    const profile = await fetchProfile(authUser.id);

    if (!profile) {
      setLoginError("Профиль пользователя не найден");
      await supabase.auth.signOut();
      setProfileLoading(false);
      return;
    }

    setUser(profile);
    setProfileLoading(false);
    setLoginError("");
  };

  const logout = async () => {
    if (user && typeof window !== "undefined") {
      window.localStorage.removeItem(`profile-${user.id}`);
    }

    await supabase.auth.signOut();
    setUser(null);
    setLoginForm({ login: "", password: "" });
  };

  const resetForm = () => {
    setForm({
      ...createEmptyOrderForm(EMPTY_ITEM),
      orderDate: getTodayDate(),
      items: [{ ...EMPTY_ITEM }],
    });
    setEditingOrderId(null);
  };

  const openCreate = () => {
    if (user?.role !== "admin") return;

    setEditingOrderId(null);
    setForm({
      ...createEmptyOrderForm(EMPTY_ITEM),
      orderDate: getTodayDate(),
      items: [{ ...EMPTY_ITEM }],
    });
    setOpen(true);
  };

  const openEdit = (order: OrderWithItems) => {
    if (user?.role === "viewer") return;

    setEditingOrderId(order.id);
    setForm({
      clientOrder: order.client_order || "",
      orderDate: order.order_date || "",
      orderType: order.order_type || "Стандартный",
      comment: order.comment || "",
      newComment: "",
      bulkPlannedDate: "",
      bulkStatus: "Новый",
      items:
        order.order_items?.map((item) => ({
          id: item.id,
          article: item.article || "",
          hasReplacement: !!item.replacement_article,
          replacementArticle: item.replacement_article || "",
          name: item.name || "",
          quantity: item.quantity || "",
          plannedDate: item.planned_date || "",
          status: item.status || "Новый",
          deliveredDate: item.delivered_date || "",
          canceledDate: item.canceled_date || "",
        })) || [{ ...EMPTY_ITEM }],
    });
    setOpen(true);
  };

  const canEditOrderTextFields = () => user?.role === "admin";
  const canEditItemMainFields = () => user?.role === "admin";
  const canImportItems = () => user?.role === "admin";
  const canEditItemStatusFields = () =>
    user?.role === "admin" || user?.role === "supplier";
  const canComment = () => !!user && user.role !== "viewer";

  const updateItemField = (
    index: number,
    field: keyof ItemForm,
    value: string | boolean
  ) => {
    if (field === "status" && value === "Отменен") {
      const currentItem = form.items[index];
      const currentStatus = currentItem?.status || "Новый";

      if (currentStatus !== "Отменен") {
        const reason = window.prompt(
          `Укажи причину отмены для позиции "${
            currentItem?.article || currentItem?.name || "без названия"
          }":`
        );

        if (!reason || !reason.trim()) {
          alert("Для отмены поставки нужно обязательно указать причину");
          return;
        }

        const itemLabel =
          currentItem?.article || currentItem?.name || "без названия";

        setForm((prev) => {
          const updatedItems = [...prev.items];
          const current = updatedItems[index];

          const nextItem = {
            ...current,
            status: "Отменен",
            canceledDate: getTodayDate(),
            deliveredDate: "",
          };

          updatedItems[index] = nextItem;

          return {
            ...prev,
            comment: appendCommentEntries(prev.comment, [
              buildCommentEntry(
                user?.name || "Система",
                `Позиция ${itemLabel}: статус изменен на "Отменен". Причина: ${reason.trim()}`
              ),
            ]),
            items: updatedItems,
          };
        });

        return;
      }
    }

    setForm((prev) => {
      const updatedItems = [...prev.items];
      const current = updatedItems[index];

      const nextItem = {
        ...current,
        [field]: value,
      } as ItemForm;

      if (field === "status") {
        if (value === "Поставлен") {
          nextItem.deliveredDate = getTodayDate();
          nextItem.canceledDate = "";
        } else {
          nextItem.deliveredDate = "";
        }

        if (value === "Отменен") {
          nextItem.canceledDate = getTodayDate();
          nextItem.deliveredDate = "";
        } else if (value !== "Поставлен") {
          nextItem.canceledDate = "";
        }
      }

      if (field === "hasReplacement" && value === false) {
        nextItem.replacementArticle = "";
      }

      updatedItems[index] = nextItem;

      return { ...prev, items: updatedItems };
    });
  };

  const applyBulkPlannedDate = () => {
    if (!form.bulkPlannedDate) {
      alert("Сначала выбери плановую дату");
      return;
    }

    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        plannedDate: prev.bulkPlannedDate,
      })),
    }));
  };

  const applyBulkStatus = () => {
    if (!form.bulkStatus) {
      alert("Сначала выбери статус");
      return;
    }

    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        status: prev.bulkStatus,
        deliveredDate: prev.bulkStatus === "Поставлен" ? getTodayDate() : "",
        canceledDate: prev.bulkStatus === "Отменен" ? getTodayDate() : "",
      })),
    }));
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItemRow = (index: number) => {
    setForm((prev) => {
      if (prev.items.length === 1) {
        return {
          ...prev,
          items: [{ ...EMPTY_ITEM }],
        };
      }

      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  };

  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });

      const importedItems = parseExcelItems(rows);

      if (importedItems.length === 0) {
        alert(
          "Не удалось найти данные. Проверь, чтобы в Excel были колонки Артикул, Наименование, Количество"
        );
        return;
      }

      setForm((prev) => {
        const hasOnlyEmptyRow =
          prev.items.length === 1 &&
          !prev.items[0].article &&
          !prev.items[0].name &&
          !prev.items[0].quantity &&
          !prev.items[0].plannedDate &&
          !prev.items[0].deliveredDate &&
          !prev.items[0].canceledDate &&
          !prev.items[0].replacementArticle;

        const preparedItems = importedItems.map((item) => ({
          ...item,
          plannedDate: prev.bulkPlannedDate || item.plannedDate,
          status: prev.bulkStatus || item.status,
          deliveredDate:
            (prev.bulkStatus || item.status) === "Поставлен" ? getTodayDate() : "",
          canceledDate:
            (prev.bulkStatus || item.status) === "Отменен" ? getTodayDate() : "",
        }));

        return {
          ...prev,
          items: hasOnlyEmptyRow ? preparedItems : [...prev.items, ...preparedItems],
        };
      });

      alert(`Загружено позиций: ${importedItems.length}`);
    } catch (error) {
      console.error(error);
      alert("Не удалось прочитать Excel-файл");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const saveForm = async () => {
    if (!user) return;
    if (saving) return;

    if (user.role === "viewer") {
      alert("Наблюдатель не может редактировать заказы");
      return;
    }

    if (user.role === "supplier" && !editingOrderId) {
      alert("Поставщик не может создавать новые заказы");
      return;
    }

    if (!form.clientOrder) {
      alert("Укажи номер клиентского заказа");
      return;
    }

    setSaving(true);

    try {
      const validItems = form.items.filter(
        (item) =>
          item.article.trim() ||
          item.name.trim() ||
          item.quantity.trim() ||
          item.plannedDate.trim() ||
          item.deliveredDate.trim() ||
          item.canceledDate.trim() ||
          item.replacementArticle.trim()
      );

      if (validItems.length === 0) {
        alert("Добавь хотя бы одну позицию");
        return;
      }

      const existingOrder = editingOrderId
        ? orders.find((x) => x.id === editingOrderId)
        : null;

      const existingItemsMap = new Map<number, OrderItem>(
        (existingOrder?.order_items || []).map((item) => [item.id, item])
      );

      const autoCommentEntries: string[] = [];

      for (const item of validItems) {
        if (item.hasReplacement && !item.replacementArticle.trim()) {
          alert(
            `Для позиции "${item.article || item.name || "без названия"}" отмечена замена, но не указан актуальный артикул`
          );
          return;
        }

        if (item.status === "Поставлен" && !item.deliveredDate) {
          alert(
            `Для позиции "${item.article || item.name || "без названия"}" со статусом 'Поставлен' должна быть дата поставки`
          );
          return;
        }

        if (item.status === "Отменен" && !item.canceledDate) {
          alert(
            `Для позиции "${item.article || item.name || "без названия"}" со статусом 'Отменен' должна быть дата отмены`
          );
          return;
        }

        if (isEditing && item.id) {
          const oldItem = existingItemsMap.get(item.id);

          if (oldItem) {
            const oldPlanned = oldItem.planned_date || "";
            const newPlanned = item.plannedDate || "";

            if (oldPlanned && oldPlanned !== newPlanned) {
              const itemLabel = item.article || item.name || "без названия";
              autoCommentEntries.push(
                buildCommentEntry(
                  user.name,
                  `Позиция ${itemLabel}: изменена плановая дата поставки. Было: ${formatDate(
                    oldPlanned || null
                  )}. Стало: ${formatDate(newPlanned || null)}`
                )
              );
            }
          }
        }
      }

      if (isEditing) {
        const invalidItems = validItems.some((item) => !item.id);
        if (invalidItems) {
          alert("Нельзя добавлять новые позиции в уже созданном заказе");
          return;
        }
      }

      let nextComment = form.comment || "";

      if (autoCommentEntries.length > 0) {
        nextComment = appendCommentEntries(nextComment, autoCommentEntries);
      }

      if (form.newComment.trim()) {
        nextComment = mergeComments(nextComment, user.name, form.newComment);
      }

      const nowTimestamp = formatDateTimeForDb();

      const headerPayload = {
        client_order: form.clientOrder,
        order_date: form.orderDate || null,
        order_type: form.orderType,
        comment: nextComment,
        updated_by: user.name,
        updated_at: nowTimestamp,
      };

      let orderId = editingOrderId;

      if (editingOrderId) {
        const { error } = await supabase
          .from("orders_v2")
          .update({
            client_order: headerPayload.client_order,
            order_date: headerPayload.order_date,
            comment: headerPayload.comment,
            updated_by: headerPayload.updated_by,
            updated_at: headerPayload.updated_at,
          })
          .eq("id", editingOrderId);

        if (error) {
          console.error("Ошибка обновления заказа:", error);
          alert("Ошибка обновления заказа: " + error.message);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("orders_v2")
          .insert(headerPayload)
          .select()
          .single();

        if (error) {
          console.error("Ошибка создания заказа:", error);
          alert("Ошибка создания заказа: " + error.message);
          return;
        }

        orderId = data.id;
      }

      if (!orderId) {
        alert("Не удалось определить ID заказа");
        return;
      }

      const existingItemIds =
        orders.find((x) => x.id === orderId)?.order_items?.map((x) => x.id) || [];
      const currentItemIds = validItems
        .map((item) => item.id)
        .filter(Boolean) as number[];

      const itemIdsToDelete = existingItemIds.filter((id) => !currentItemIds.includes(id));

      if (itemIdsToDelete.length > 0) {
        if (user.role !== "admin" || isEditing) {
          alert("Нельзя удалять позиции в уже созданном заказе");
          return;
        }

        const { error } = await supabase
          .from("order_items")
          .delete()
          .in("id", itemIdsToDelete);

        if (error) {
          console.error("Ошибка удаления позиций:", error);
          alert("Ошибка удаления позиций: " + error.message);
          return;
        }
      }

      for (const item of validItems) {
        const itemPayload = {
          order_id: orderId,
          article: item.article,
          replacement_article: item.hasReplacement ? item.replacementArticle : null,
          name: item.name,
          quantity: item.quantity,
          planned_date: item.plannedDate || null,
          status: item.status,
          delivered_date: item.deliveredDate || null,
          canceled_date: item.canceledDate || null,
        };

        if (item.id) {
          const { error } = await supabase
            .from("order_items")
            .update(itemPayload)
            .eq("id", item.id);

          if (error) {
            console.error("Ошибка обновления позиции:", error);
            alert("Ошибка обновления позиции: " + error.message);
            return;
          }
        } else {
          const { error } = await supabase.from("order_items").insert(itemPayload);

          if (error) {
            console.error("Ошибка добавления позиции:", error);
            alert("Ошибка добавления позиции: " + error.message);
            return;
          }
        }
      }

      setOpen(false);
      resetForm();
      await loadOrders();
    } finally {
      setSaving(false);
    }
  };

  const removeOrder = async (id: number) => {
    if (user?.role !== "admin") {
      alert("Удалять заказы может только администратор");
      return;
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);

    if (itemsError) {
      console.error("Ошибка удаления позиций:", itemsError);
      alert("Ошибка удаления позиций: " + itemsError.message);
      return;
    }

    const { error: orderError } = await supabase
      .from("orders_v2")
      .delete()
      .eq("id", id);

    if (orderError) {
      console.error("Ошибка удаления заказа:", orderError);
      alert("Ошибка удаления заказа: " + orderError.message);
      return;
    }

    setExpandedOrders((prev) => prev.filter((x) => x !== id));
    loadOrders();
  };

  const updateItemStatusQuick = async (
    orderId: number,
    item: OrderItem,
    newStatus: string
  ) => {
    if (!user) return;

    if (user.role === "viewer") {
      alert("Наблюдатель не может менять статус");
      return;
    }

    let nextComment = orders.find((x) => x.id === orderId)?.comment || "";
    const nowTimestamp = formatDateTimeForDb();
    const today = getTodayDate();

    const itemUpdatePayload: {
      status: string;
      delivered_date?: string | null;
      canceled_date?: string | null;
    } = { status: newStatus };

    if (newStatus === "Поставлен") {
      itemUpdatePayload.delivered_date = today;
      itemUpdatePayload.canceled_date = null;
    }

    if (newStatus === "Отменен") {
      const reason = window.prompt(
        `Укажи причину отмены для позиции "${item.article || item.name || "без названия"}":`
      );

      if (!reason || !reason.trim()) {
        alert("Для отмены поставки нужно обязательно указать причину");
        return;
      }

      const itemLabel = item.article || item.name || "без названия";
      nextComment = appendCommentEntries(nextComment, [
        buildCommentEntry(
          user.name,
          `Позиция ${itemLabel}: статус изменен на "Отменен". Причина: ${reason.trim()}`
        ),
      ]);

      itemUpdatePayload.canceled_date = today;
      itemUpdatePayload.delivered_date = null;
    }

    if (newStatus !== "Поставлен" && newStatus !== "Отменен") {
      itemUpdatePayload.delivered_date = null;
      itemUpdatePayload.canceled_date = null;
    }

    const { error } = await supabase
      .from("order_items")
      .update(itemUpdatePayload)
      .eq("id", item.id);

    if (error) {
      console.error("Ошибка обновления статуса позиции:", error);
      alert("Ошибка обновления статуса позиции: " + error.message);
      return;
    }

    const { error: orderError } = await supabase
      .from("orders_v2")
      .update({
        updated_by: user.name,
        updated_at: nowTimestamp,
        comment: nextComment,
      })
      .eq("id", orderId);

    if (orderError) {
      console.error("Ошибка обновления заказа:", orderError);
      alert("Ошибка обновления заказа: " + orderError.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              updated_by: user.name,
              updated_at: nowTimestamp,
              comment: nextComment,
              order_items: (order.order_items || []).map((row) =>
                row.id === item.id
                  ? {
                      ...row,
                      status: newStatus,
                      delivered_date:
                        newStatus === "Поставлен"
                          ? today
                          : newStatus === "Отменен"
                          ? null
                          : null,
                      canceled_date:
                        newStatus === "Отменен"
                          ? today
                          : newStatus === "Поставлен"
                          ? null
                          : null,
                    }
                  : row
              ),
            }
          : order
      )
    );
  };

  const copyArticle = async (article: string | null) => {
    if (!article) return;

    try {
      await navigator.clipboard.writeText(article);
      setCopiedArticle(article);
    } catch {
      alert("Не удалось скопировать артикул");
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((x) => x !== orderId)
        : [...prev, orderId]
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginForm
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Центр управления заказами
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-4xl">
                  Общая таблица заказов
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  Система обработки и мониторинга заказов Автодом – Союз.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-[320px] lg:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-300">Пользователь:</span>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur">
                    {profileLoading
                      ? "Загрузка профиля..."
                      : `${user.name} · ${
                          user.role === "admin"
                            ? "Администратор"
                            : user.role === "supplier"
                            ? "Поставщик"
                            : "Наблюдатель"
                        }`}
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                  >
                    Выйти
                  </button>
                </div>

                {user.role === "admin" ? (
                  <button
                    onClick={openCreate}
                    className="rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
                  >
                    Добавить заказ
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <OrdersToolbar
          stats={stats}
          search={search}
          setSearch={setSearch}
          orderTypeFilter={orderTypeFilter}
          setOrderTypeFilter={setOrderTypeFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          setSortField={setSortField}
          setSortDirection={setSortDirection}
        />

        <OrdersTable
          loading={loading}
          orders={filteredOrders}
          expandedOrders={expandedOrders}
          copiedArticle={copiedArticle}
          user={user}
          toggleOrderExpand={toggleOrderExpand}
          openEdit={openEdit}
          removeOrder={removeOrder}
          updateItemStatusQuick={updateItemStatusQuick}
          copyArticle={copyArticle}
        />

        <OrderFormModal
          open={open}
          saving={saving}
          editingOrderId={editingOrderId}
          userRole={user.role}
          form={form}
          parsedComments={parsedComments}
          fileInputRef={fileInputRef}
          canEditOrderTextFields={canEditOrderTextFields()}
          canEditItemMainFields={canEditItemMainFields()}
          canImportItems={canImportItems()}
          canEditItemStatusFields={canEditItemStatusFields()}
          canComment={canComment()}
          setOpen={setOpen}
          setForm={setForm}
          applyBulkPlannedDate={applyBulkPlannedDate}
          applyBulkStatus={applyBulkStatus}
          handleExcelUpload={handleExcelUpload}
          addItemRow={addItemRow}
          updateItemField={updateItemField}
          removeItemRow={removeItemRow}
          saveForm={saveForm}
        />
      </div>
    </div>
  );
}
