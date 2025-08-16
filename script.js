document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "todos_v2"; // v2: カテゴリ付き
  let todos = load();

  // 要素
  const addBtn = document.getElementById("addButton");
  const input  = document.getElementById("taskInput");
  const catInp = document.getElementById("catInput");
  const list   = document.getElementById("taskList");
  const statusFilter = document.getElementById("statusFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const counter = document.getElementById("counter");

  // 初期描画
  syncCategoryFilter();
  render();

  // 追加
  addBtn.addEventListener("click", handleAdd);
  input.addEventListener("keydown", e => (e.key === "Enter") && handleAdd());
  catInp.addEventListener("keydown", e => (e.key === "Enter") && handleAdd());

  function handleAdd() {
    const text = input.value.trim();
    const cat  = catInp.value.trim() || "予定"; // 何もなければ「予定」
    if (!text) return;

    todos.push({ id: Date.now(), text, category: cat, done: false });
    input.value = ""; catInp.value = "";
    persist();
    syncCategoryFilter();
    render();
  }

  // フィルタ
  statusFilter.addEventListener("change", render);
  categoryFilter.addEventListener("change", render);

  function render() {
    list.innerHTML = "";

    const filtered = todos.filter(t => {
      const byStatus =
        statusFilter.value === "all"   ? true :
        statusFilter.value === "done"  ? t.done : !t.done;

      const byCat =
        categoryFilter.value === "all" ? true :
        t.category === categoryFilter.value;

      return byStatus && byCat;
    });

    filtered
      // 未完了を上、完了を下
      .sort((a, b) => Number(a.done) - Number(b.done))
      .forEach(t => list.appendChild(row(t)));

    const activeCount = todos.filter(t => !t.done).length;
    counter.textContent = `未完了: ${activeCount}件 / 合計: ${todos.length}件`;
  }

  function row(t) {
    const li = document.createElement("li");

    // チェック
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "checkbox";
    cb.checked = t.done;
    cb.addEventListener("change", () => {
      t.done = cb.checked;
      persist(); render();
    });

    // テキスト（ダブルクリックで編集）
    const span = document.createElement("span");
    span.className = "text" + (t.done ? " done" : "");
    span.textContent = t.text;
    span.title = "ダブルクリックで編集";
    span.addEventListener("dblclick", () => startTextEdit(span, t));

    // カテゴリバッジ（タップ/ダブルクリックで編集）
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = t.category;
    badge.title = "クリックでカテゴリ編集";
    badge.addEventListener("click", () => startCategoryEdit(badge, t));

    const textWrap = document.createElement("div");
    textWrap.appendChild(span);
    textWrap.appendChild(badge);

    // アクション
    const actions = document.createElement("div");
    actions.className = "actions";
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "削除";
    del.addEventListener("click", () => {
      todos = todos.filter(x => x.id !== t.id);
      persist(); syncCategoryFilter(); render();
    });
    actions.appendChild(del);

    li.appendChild(cb);
    li.appendChild(textWrap);
    li.appendChild(actions);
    return li;
  }

  function startTextEdit(span, t) {
    const input = document.createElement("input");
    input.className = "edit-input";
    input.value = t.text;
    span.replaceWith(input);
    input.focus();
    input.select();

    const commit = () => {
      t.text = input.value.trim() || t.text;
      persist(); render();
    };
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") render();
    });
    input.addEventListener("blur", commit);
  }

  function startCategoryEdit(badge, t) {
    const wrap = document.createElement("span");
    wrap.className = "badge editing";
    const input = document.createElement("input");
    input.className = "edit-input";
    input.value = t.category;
    wrap.appendChild(input);
    badge.replaceWith(wrap);
    input.focus();
    input.select();

    const commit = () => {
      t.category = input.value.trim() || t.category;
      persist(); syncCategoryFilter(); render();
    };
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") render();
    });
    input.addEventListener("blur", commit);
  }

  // カテゴリフィルタの選択肢をtodosから自動生成
  function syncCategoryFilter() {
    const cats = Array.from(new Set(todos.map(t => t.category))).sort();
    const current = categoryFilter.value || "all";
    categoryFilter.innerHTML = `<option value="all">すべて</option>` +
      cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    // 現在の選択を維持
    const exists = [...categoryFilter.options].some(o => o.value === current);
    categoryFilter.value = exists ? current : "all";
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
});