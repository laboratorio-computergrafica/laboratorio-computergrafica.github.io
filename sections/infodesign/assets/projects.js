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

d3.csv("./lcg-infodesign-projects.csv").then((rows) => {
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
      return {
        ...project,
        thumbnail: getThumbnailPath(project.code),
        projectName: (
          project.description ||
          project.title ||
          "Progetto"
        ).trim(),
      };
    });

    const cards = section
      .append("div")
      .attr("class", "projects-grid")
      .attr("id", yearPanelId)
      .selectAll(".project-card")
      .data(cardsData)
      .enter()
      .append((d) => document.createElement(d.link ? "a" : "article"))
      .attr("class", "project-card")
      .attr("href", (d) => d.link || null)
      .attr("target", (d) => (d.link ? "_blank" : null))
      .attr("rel", (d) => (d.link ? "noreferrer noopener" : null));

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
      .text((d) => d.authors || "");
  });
});
