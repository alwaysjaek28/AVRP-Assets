const sheet = document.getElementById("sheet");
const openMenu = document.getElementById("openMenu");
const closeMenu = document.getElementById("closeMenu");
const crumb = document.getElementById("crumb");

const pages = {
  home: document.getElementById("page-home"),
  pay: document.getElementById("page-pay"),
  forum: document.getElementById("page-forum"),
  jobs: document.getElementById("page-jobs"),
};

function setRoute(route) {
  Object.values(pages).forEach(p => p.classList.remove("isVisible"));
  pages[route].classList.add("isVisible");

  document.querySelectorAll(".sheetBtn").forEach(b => b.classList.remove("isActive"));
  document.querySelector(`.sheetBtn[data-route="${route}"]`)?.classList.add("isActive");

  const map = { home: "главная", pay: "главная", forum: "форум", jobs: "вакансии" };
  crumb.textContent = map[route] ?? "главная";
  document.title = `mobile / ${crumb.textContent}`;
}

function openSheet() {
  sheet.classList.add("isOpen");
  sheet.setAttribute("aria-hidden", "false");
  openMenu.classList.add("hidden");
  closeMenu.classList.remove("hidden");
}

function closeSheet() {
  sheet.classList.remove("isOpen");
  sheet.setAttribute("aria-hidden", "true");
  closeMenu.classList.add("hidden");
  openMenu.classList.remove("hidden");
}

openMenu.addEventListener("click", openSheet);
closeMenu.addEventListener("click", closeSheet);

sheet.addEventListener("click", (e) => {
  if (e.target === sheet) closeSheet();
});

document.querySelectorAll(".sheetBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    setRoute(btn.dataset.route);
    closeSheet();
  });
});

// выбор способа оплаты
document.querySelectorAll(".method").forEach(m => {
  m.addEventListener("click", () => {
    document.querySelectorAll(".method").forEach(x => x.classList.remove("isSelected"));
    m.classList.add("isSelected");
  });
});

// submit (заглушка)
document.querySelector(".payForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Заявка на пополнение отправлена (заглушка).");
});

// старт
setRoute("home");
