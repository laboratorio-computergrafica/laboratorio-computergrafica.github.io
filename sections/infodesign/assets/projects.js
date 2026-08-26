const createPlaceholderThumbnail = (label) => {
  const safeLabel = label || "Project";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="100%" height="100%" fill="#efefef"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Aileron, sans-serif" font-size="36" fill="#555">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const splitList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const getThumbnailPath = (code) => {
  const normalizedCode = (code || "").trim().replace(/-(\d)$/, "-0$1");
  return `assets/projects/${normalizedCode}.png`;
};

const modalOverlay = document.createElement("div");
modalOverlay.className = "project-modal-overlay";
modalOverlay.hidden = true;
modalOverlay.innerHTML = `
  <div class="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
    <button type="button" class="project-modal-close" aria-label="Chiudi">&times;</button>
    <img class="project-modal-image" alt="" />
    <div class="project-modal-body">
      <div class="project-modal-title" id="project-modal-title"></div>
      <div class="project-modal-actions"></div>
      <div class="project-modal-authors">
        <div class="project-modal-section-title">Autori</div>
        <div class="project-modal-authors-list"></div>
      </div>
    </div>
  </div>
`;
document.body.appendChild(modalOverlay);

const modalImage = modalOverlay.querySelector(".project-modal-image");
const modalTitle = modalOverlay.querySelector(".project-modal-title");
const modalActions = modalOverlay.querySelector(".project-modal-actions");
const modalAuthorsList = modalOverlay.querySelector(".project-modal-authors-list");
const modalClose = modalOverlay.querySelector(".project-modal-close");

let lastFocusedElement = null;

const closeModal = () => {
  if (modalOverlay.hidden) return;
  modalOverlay.hidden = true;
  document.body.classList.remove("modal-open");
  if (lastFocusedElement) lastFocusedElement.focus();
};

const openModal = (data, triggerEl) => {
  lastFocusedElement = triggerEl || null;

  modalImage.onerror = () => {
    modalImage.onerror = null;
    modalImage.src = createPlaceholderThumbnail(data.projectName);
  };
  modalImage.src = data.thumbnail;
  modalImage.alt = `Anteprima progetto ${data.projectName}`;
  modalTitle.textContent = data.projectName;

  modalActions.innerHTML = "";
  if (data.link) {
    const siteLink = document.createElement("a");
    siteLink.className = "external-link";
    siteLink.href = data.link;
    siteLink.target = "_blank";
    siteLink.rel = "noreferrer noopener";
    siteLink.textContent = "Vedi sito";
    modalActions.appendChild(siteLink);
  }
  if (data.repo) {
    const repoLink = document.createElement("a");
    repoLink.className = "external-link";
    repoLink.href = data.repo;
    repoLink.target = "_blank";
    repoLink.rel = "noreferrer noopener";
    repoLink.textContent = "Vedi codice";
    modalActions.appendChild(repoLink);
  }

  modalAuthorsList.innerHTML = "";
  const authors = data.people || [];
  authors.forEach((person, index) => {
    const name = (person.public_name || `${person.Nome} ${person.Cognome}`).trim();
    const url = (person.url || "").trim();
    const el = document.createElement(url ? "a" : "span");
    el.className = "project-modal-author";
    if (url) {
      el.href = url;
      el.target = "_blank";
      el.rel = "noreferrer noopener";
    }
    el.textContent = name;
    modalAuthorsList.appendChild(el);
    if (index < authors.length - 1) {
      modalAuthorsList.appendChild(document.createTextNode(", "));
    }
  });

  modalOverlay.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
};

modalClose.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

Promise.all([
  d3.csv("./lcg-infodesign-projects.csv"),
  d3.csv("./people-data.csv"),
]).then(([rows, peopleRows]) => {
  const peopleByProject = d3.group(peopleRows, (d) => d.progetto.trim());

  const projectsByYear = d3
    .groups(rows, (d) => d.year)
    .sort((a, b) => d3.descending(+a[0], +b[0]));

  const root = d3.select("#projects");

  projectsByYear.forEach(([year, projects]) => {
    const yearPanelId = `projects-year-${year}`;
    const section = root
      .append("div")
      .attr("class", "projects-year")
      .classed("is-open", true);

    const title = section
      .append("div")
      .attr("class", "projects-year-title")
      .attr("role", "button")
      .attr("tabindex", "0")
      .attr("aria-expanded", "true")
      .attr("aria-controls", yearPanelId);

    const toggleYear = () => {
      const isOpen = !section.classed("is-open");
      section.classed("is-open", isOpen);
      title.attr("aria-expanded", String(isOpen));
    };

    title
      .on("click", toggleYear)
      .on("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggleYear();
      });

    title.append("div").attr("class", "projects-year-number").text(year);

    const teacherNames = [...new Set(splitList(projects[0].teachers))];
    const teachers = title
      .append("div")
      .attr("class", "projects-year-professors");

    teachers.append("div").attr("class", "section-title").text("Professori");

    teachers
      .selectAll(".professor-name")
      .data(teacherNames)
      .enter()
      .append("div")
      .attr("class", "professor-name")
      .text((d) => d);

    const assistantNames = [
      ...new Set(projects.flatMap((project) => splitList(project.assissants))),
    ];
    const assistants = title
      .append("div")
      .attr("class", "projects-year-assistants");

    assistants.append("div").attr("class", "section-title").text("Assistants");

    assistants
      .selectAll(".assistant-name")
      .data(assistantNames)
      .enter()
      .append("div")
      .attr("class", "assistant-name")
      .text((d) => d);

    const cardsData = projects.map((project) => {
      const projectName = (
        project.description ||
        project.title ||
        "Progetto"
      ).trim();
      const people = (
        peopleByProject.get(`${project.year} - ${project.description}`) || []
      )
        .slice()
        .sort(
          (a, b) =>
            d3.ascending(a.Cognome, b.Cognome) ||
            d3.ascending(a.Nome, b.Nome),
        );
      return {
        ...project,
        thumbnail: getThumbnailPath(project.code),
        projectName,
        people,
      };
    });

    const cards = section
      .append("div")
      .attr("class", "projects-grid")
      .attr("id", yearPanelId)
      .selectAll(".project-card")
      .data(cardsData)
      .enter()
      .append("div")
      .attr("class", "project-card")
      .attr("role", "button")
      .attr("tabindex", "0")
      .on("click", function (event, d) {
        openModal(d, this);
      })
      .on("keydown", function (event, d) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openModal(d, this);
      });

    cards
      .append("img")
      .attr("class", "project-thumbnail")
      .attr("src", (d) => d.thumbnail)
      .attr("alt", (d) => `Anteprima progetto ${d.projectName}`)
      .on("error", function (_, d) {
        this.onerror = null;
        this.src = createPlaceholderThumbnail(d.projectName);
      });

    cards
      .append("div")
      .attr("class", "project-title")
      .text((d) => d.projectName);

    cards
      .append("div")
      .attr("class", "project-authors")
      .text((d) =>
        d.people
          .map((person) => (person.public_name || `${person.Nome} ${person.Cognome}`).trim())
          .join(", "),
      );
  });
});
