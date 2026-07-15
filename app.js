const importedPadlet = window.PADLET_RESOURCES ?? { resources: [] };
const pilotQuestionnaireResource = {
  id: "pilot-questionnaire-anonyme-ressources",
  postNumber: 1001,
  title: "Questionnaire anonyme sur les ressources du site",
  section: "Votre section, vos expériences, vos partages",
  category: "Expériences",
  tagClass: "experience",
  summary:
    "Cinq questions anonymes pour mieux comprendre quelles ressources vous sont utiles et améliorer le site.",
  body:
    "Vos réponses aideront Audrey Fabre à améliorer les informations et les outils proposés aux patients et aux aidants.",
  illustration: null,
  attachment: null,
  diseaseIds: ["huntington", "parkinson"],
  importedComments: [],
  format: "questionnaire",
  questionnaire: {
    questions: [
      {
        id: "profil",
        prompt: "Vous consultez ce site en tant que :",
        type: "single",
        options: ["Patient ou patiente", "Aidant ou aidante", "Autre"],
        required: true,
      },
      {
        id: "comprehension",
        prompt: "Les informations sont-elles faciles à comprendre ?",
        type: "scale",
        options: [],
        required: true,
      },
      {
        id: "recherche",
        prompt: "Les fiches sont-elles faciles à trouver ?",
        type: "scale",
        options: [],
        required: true,
      },
      {
        id: "ressources-utiles",
        prompt: "Quels thèmes ou quelles ressources vous sont les plus utiles ?",
        type: "long",
        options: [],
        required: false,
      },
      {
        id: "ameliorations",
        prompt: "Que pourrions-nous améliorer sur ce site ?",
        type: "long",
        options: [],
        required: false,
      },
    ],
  },
};
const baseResources = [...importedPadlet.resources, pilotQuestionnaireResource];
const apiBaseUrl = String(window.AUDREY_API_BASE_URL ?? "").replace(/\/+$/, "");
const apiEnabled = Boolean(apiBaseUrl);
const svgNamespace = "http://www.w3.org/2000/svg";
const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), iframe, video, [tabindex]:not([tabindex="-1"])';

const diseases = [
  {
    id: "huntington",
    label: "Maladie de Huntington",
  },
  {
    id: "parkinson",
    label: "Maladie de Parkinson",
  },
];
const homeTab = {
  id: "accueil",
  label: "Accueil",
};
const appointmentTab = {
  id: "prise-rendez-vous",
  label: "Prise de rendez-vous",
};
const contactTab = {
  id: "contact",
  label: "Contact",
};
const navigationTabs = [homeTab, ...diseases, appointmentTab, contactTab];

const storagePrefix = "audrey-orthophonie-comments-v2";
const resourceStorageKey = "audrey-orthophonie-resources-v1";
const appointmentStorageKey = "audrey-orthophonie-appointments-v1";
const siteContentStorageKey = "audrey-orthophonie-site-content-v1";
const questionnaireStorageKey = "audrey-orthophonie-questionnaire-responses-v1";
const authStorageKey = "audrey-orthophonie-auth";
const adminLogin = "audrey";
const localAdminPasswordHash = "0e5a170ff0867a879d950b746ab6c1b741cbb413769c35e9647f1e5726a137a4";
const maxLocalAttachmentBytes = 3 * 1024 * 1024;
const contactEmail = "audrey.fabre@aphp.fr";
const newThemeOptionValue = "__new_theme__";
const defaultSiteContent = {
  homeTitle: "Bienvenue sur L'orthophonie au quotidien",
  homeBody:
    "Ce site est destiné aux patients et à leurs aidants.\n\n" +
    "Vous y trouverez des informations et des outils sur la maladie de Huntington et la maladie de Parkinson. Les fiches sont classées par thème et peuvent être recherchées par mot-clé.\n\n" +
    "Vous pouvez aussi laisser un commentaire sur une fiche, demander un rendez-vous ou contacter Audrey Fabre.",
};
const resourceSections = [
  "Les fonctions cognitives : que sont-elles ?",
  "Les fonctions cognitives dans la maladie de Huntington",
  "Les outils pour travailler les fonctions cognitives à la maison",
  "Voix et parole",
  "La déglutition",
  "Autres ressources",
  "Votre section, vos expériences, vos partages",
];
const alwaysVisibleResourceSections = ["Voix et parole"];
const generatedPreviewBasePath = "assets/generated/";
const generatedPreviewByResourceId = {
  "padlet-02-les-fonctions-executives": "executive-functions.jpg",
  "padlet-03-la-perception-visuo-spatiale": "visuospatial-perception.jpg",
  "padlet-04-l-attention": "attention.jpg",
  "padlet-05-la-memoire": "memory.jpg",
  "padlet-06-le-langage": "language.jpg",
  "padlet-08-carte2-manque-du-mot": "word-finding.jpg",
  "padlet-10-liste-de-jeux": "games.jpg",
  "padlet-11-les-livrets-proposes-par-des-orthophonistes-": "workbooks.jpg",
  "padlet-12-les-livrets-proposes-par-des-professionnels-": "workbooks.jpg",
  "padlet-13-jeux-de-memoire-et-exercices-cognitifs-gratu": "printable-exercises.jpg",
  "padlet-14-les-applications-numeriques": "digital-apps.jpg",
  "padlet-16-la-deglutition-en-image": "swallowing.jpg",
  "padlet-21-les-strategies-de-prevention-hygiene-bucco-d": "oral-hygiene.jpg",
  "padlet-22-les-strategies-de-prevention-posture-environ": "meal-posture.jpg",
  "padlet-23-les-strategies-reeducatives-en-autonomie": "autonomy-strategies.jpg",
  "padlet-24-focus-sur-l-olfaction": "olfaction.jpg",
  "padlet-25-la-relaxation": "relaxation.jpg",
  "padlet-27-les-plateformes-d-accompagnement": "support-platforms.jpg",
  "padlet-28-recettes-textures-modifiees": "adapted-recipes.jpg",
  "padlet-29-faites-vous-plaisir-votre-cerveau-vous-le-re": "pleasure-reading.jpg",
  "padlet-30-partage-d-experience": "experience-sharing.jpg",
};
const generatedPreviewByKind = {
  checklist: "executive-functions.jpg",
  eyeGrid: "visuospatial-perception.jpg",
  target: "attention.jpg",
  memory: "memory.jpg",
  speech: "language.jpg",
  games: "games.jpg",
  book: "workbooks.jpg",
  tablet: "digital-apps.jpg",
  swallow: "swallowing.jpg",
  tooth: "oral-hygiene.jpg",
  posture: "meal-posture.jpg",
  breath: "autonomy-strategies.jpg",
  smell: "olfaction.jpg",
  relax: "relaxation.jpg",
  support: "support-platforms.jpg",
  bowl: "adapted-recipes.jpg",
  heart: "pleasure-reading.jpg",
  story: "experience-sharing.jpg",
};

let editableResourceState = loadEditableResourceState();
let appointmentState = loadAppointmentState();
let siteContent = loadSiteContent();
let resources = [];
let resourcesById = {};
let commentState = {};
let questionnaireResponseState = loadQuestionnaireResponseState();
let adminAuthToken = getStoredAdminToken();
let isAdminLoggedIn = apiEnabled ? Boolean(adminAuthToken) : sessionStorage.getItem(authStorageKey) === "true";
let activeDiseaseId = getInitialDiseaseId();
let activeModal = null;
let activeAdminDialog = null;
let previousFocus = null;
let adminPreviousFocus = null;
let appointmentNotice = "";
let resourceSearchQuery = "";
let activeThemeFilter = "all";
let loadingIndicatorNode = null;
let loadingStack = [];
let loadingSequence = 0;

const tabsNode = document.querySelector("#diseaseTabs");
const headerNode = document.querySelector(".site-header");
const siteTitleNode = document.querySelector(".site-header h1");
const menuNode = document.querySelector(".disease-menu");
const panelNode = document.querySelector("#resourcePanel");
const metricsNode = document.querySelector("#panelMetrics");
const gridNode = document.querySelector("#resourceGrid");
let adminControlsNode = null;

initializeApp();

window.addEventListener("hashchange", () => {
  const nextId = normalizeDiseaseId(window.location.hash.replace("#", ""));

  if (nextId !== activeDiseaseId) {
    activeDiseaseId = nextId;
    renderTabs();
    renderDisease();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeAdminDialog) {
    closeAdminDialog();
    return;
  }

  if (event.key === "Escape" && activeModal) {
    closeResourceModal();
  }

  if (event.key === "Tab" && activeAdminDialog) {
    trapFocus(event, activeAdminDialog);
  } else if (event.key === "Tab" && activeModal) {
    trapFocus(event, activeModal, { includeTabs: true });
  }
});

async function initializeApp() {
  const stopLoading = apiEnabled ? startLoading("Chargement des données du site...") : () => {};

  try {
    await loadBackendState();
    refreshResourceIndex();
    renderTabs();
    renderAdminControls();
    renderDisease();
    setupSiteTitleNavigation();
  } finally {
    stopLoading();
  }
}

function getStoredAdminToken() {
  if (!apiEnabled) {
    return "";
  }

  const token = sessionStorage.getItem(authStorageKey) || "";
  return token && token !== "true" ? token : "";
}

async function loadBackendState(options = {}) {
  const { silent = false } = options;

  if (!apiEnabled) {
    return false;
  }

  try {
    const state = await apiRequest("/api/state", { auth: true });
    editableResourceState = normalizeEditableResourceState(state.resourceState);
    appointmentState = normalizeAppointmentState(state.appointmentState);
    siteContent = normalizeSiteContent(state.siteContent);
    commentState = normalizeCommentStateMap(state.commentsByResourceId);
    questionnaireResponseState = normalizeQuestionnaireResponseState(
      state.questionnaireResponsesByResourceId,
    );
    isAdminLoggedIn = Boolean(state.isAdmin);

    if (!isAdminLoggedIn && adminAuthToken) {
      adminAuthToken = "";
      sessionStorage.removeItem(authStorageKey);
    }

    return true;
  } catch (error) {
    if (!silent) {
      console.error("Impossible de charger les données du backend.", error);
    }

    adminAuthToken = "";
    isAdminLoggedIn = false;
    sessionStorage.removeItem(authStorageKey);

    return false;
  }
}

async function refreshFromBackendAndRender(options = {}) {
  await loadBackendState({ silent: true });
  refreshResourceIndex();
  renderAdminControls();
  renderDisease();
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body = null, auth = false } = options;
  const headers = {};

  if (body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (auth && adminAuthToken) {
    headers.Authorization = `Bearer ${adminAuthToken}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === null ? null : JSON.stringify(body),
  });

  if (!response.ok) {
    const error = new Error(`API ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.status === 204 ? null : response.json();
}

function normalizeEditableResourceState(state) {
  return {
    overrides: state && typeof state.overrides === "object" ? state.overrides : {},
    created: Array.isArray(state?.created) ? state.created : [],
    hidden: Array.isArray(state?.hidden) ? state.hidden : [],
    deleted: Array.isArray(state?.deleted) ? state.deleted : [],
  };
}

function normalizeCommentStateMap(commentsByResourceId) {
  if (!commentsByResourceId || typeof commentsByResourceId !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(commentsByResourceId).map(([resourceId, comments]) => [
      resourceId,
      Array.isArray(comments) ? comments.map(normalizeStoredComment).filter(Boolean) : [],
    ]),
  );
}

function normalizeQuestionnaireResponseState(value) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([resourceId, responses]) => [
      resourceId,
      Array.isArray(responses) ? responses.map(normalizeQuestionnaireResponse).filter(Boolean) : [],
    ]),
  );
}

function normalizeQuestionnaireResponse(response) {
  if (!response || typeof response !== "object" || !Array.isArray(response.answers)) {
    return null;
  }

  return {
    id: String(response.id || createCommentId()),
    createdAt: String(response.createdAt || ""),
    answers: response.answers
      .filter((answer) => answer && typeof answer === "object")
      .map((answer) => ({
        questionId: String(answer.questionId || ""),
        prompt: String(answer.prompt || "Question"),
        value: Array.isArray(answer.value)
          ? answer.value.map((item) => String(item))
          : String(answer.value ?? ""),
      })),
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function startLoading(message = "Traitement en cours...") {
  const id = ++loadingSequence;
  loadingStack.push({ id, message });
  renderLoadingIndicator();

  return () => {
    loadingStack = loadingStack.filter((item) => item.id !== id);
    renderLoadingIndicator();
  };
}

function renderLoadingIndicator() {
  const indicator = getLoadingIndicator();
  const active = loadingStack[loadingStack.length - 1];

  if (!active) {
    indicator.hidden = true;
    return;
  }

  indicator.hidden = false;
  indicator.querySelector(".global-loading-text").textContent = active.message;
}

function getLoadingIndicator() {
  if (loadingIndicatorNode) {
    return loadingIndicatorNode;
  }

  const indicator = document.createElement("div");
  indicator.className = "global-loading";
  indicator.setAttribute("role", "status");
  indicator.setAttribute("aria-live", "polite");
  indicator.hidden = true;

  const spinner = document.createElement("span");
  spinner.className = "global-loading-spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.className = "global-loading-text";

  indicator.append(spinner, text);
  document.body.append(indicator);
  loadingIndicatorNode = indicator;
  return indicator;
}

function setControlLoading(control, loadingText = "") {
  if (!(control instanceof HTMLElement)) {
    return () => {};
  }

  const originalText = control.textContent;
  const wasDisabled = control instanceof HTMLButtonElement ? control.disabled : false;

  control.classList.add("is-loading");
  control.setAttribute("aria-busy", "true");

  if (control instanceof HTMLButtonElement) {
    control.disabled = true;
  }

  if (loadingText) {
    control.textContent = loadingText;
  }

  return () => {
    control.classList.remove("is-loading");
    control.removeAttribute("aria-busy");

    if (control instanceof HTMLButtonElement) {
      control.disabled = wasDisabled;
    }

    if (loadingText) {
      control.textContent = originalText;
    }
  };
}

function setFormLoading(form, loadingText = "") {
  return setControlLoading(form.querySelector('button[type="submit"]'), loadingText);
}

async function verifyLocalAdminPassword(password) {
  if (!globalThis.crypto?.subtle) {
    return false;
  }

  const encoded = new TextEncoder().encode(password);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
  const hash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hash === localAdminPasswordHash;
}

function setupSiteTitleNavigation() {
  if (!siteTitleNode) {
    return;
  }

  siteTitleNode.tabIndex = 0;
  siteTitleNode.setAttribute("role", "button");
  siteTitleNode.setAttribute("aria-label", "Revenir à la page principale");
  siteTitleNode.addEventListener("click", returnToMainPage);
  siteTitleNode.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      returnToMainPage();
    }
  });
}

function returnToMainPage() {
  if (activeModal) {
    closeResourceModal({ restoreFocus: false });
  }

  if (activeAdminDialog) {
    closeAdminDialog({ restoreFocus: false });
  }

  if (window.location.hash !== `#${homeTab.id}`) {
    window.location.hash = homeTab.id;
  } else if (activeDiseaseId !== homeTab.id) {
    activeDiseaseId = homeTab.id;
    renderTabs();
    renderDisease();
  }

  panelNode.removeAttribute("aria-hidden");
  panelNode.inert = false;
  panelNode.tabIndex = -1;
  panelNode.focus({ preventScroll: true });
  document.querySelector("#contenu")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetViewAfterSessionChange() {
  appointmentNotice = "";
  resourceSearchQuery = "";
  activeThemeFilter = "all";

  if (activeModal) {
    closeResourceModal({ restoreFocus: false });
  }

  if (activeAdminDialog) {
    closeAdminDialog({ restoreFocus: false });
  }

  const homeId = homeTab.id;
  if (window.location.hash !== `#${homeId}`) {
    window.location.hash = homeId;
  }

  activeDiseaseId = homeId;
  renderTabs();
  renderAdminControls();
  renderDisease();
  panelNode.removeAttribute("aria-hidden");
  panelNode.inert = false;
  document.querySelector("#contenu")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getInitialDiseaseId() {
  return normalizeDiseaseId(window.location.hash.replace("#", ""));
}

function normalizeDiseaseId(id) {
  return navigationTabs.some((tab) => tab.id === id) ? id : homeTab.id;
}

function getActiveDisease() {
  return diseases.find((disease) => disease.id === activeDiseaseId) ?? diseases[0];
}

function normalizeSiteContent(value) {
  const homeTitle = String(value?.homeTitle ?? "").trim();
  const homeBody = String(value?.homeBody ?? "").trim();
  return {
    homeTitle: homeTitle || defaultSiteContent.homeTitle,
    homeBody: homeBody || defaultSiteContent.homeBody,
  };
}

function loadSiteContent() {
  try {
    return normalizeSiteContent(JSON.parse(localStorage.getItem(siteContentStorageKey) || "null"));
  } catch {
    return { ...defaultSiteContent };
  }
}

function saveSiteContentLocally() {
  localStorage.setItem(siteContentStorageKey, JSON.stringify(siteContent));
}

function loadEditableResourceState() {
  const fallback = { overrides: {}, created: [], hidden: [], deleted: [] };
  const raw = localStorage.getItem(resourceStorageKey);

  if (!raw) {
    return fallback;
  }

  try {
    return normalizeEditableResourceState(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function loadQuestionnaireResponseState() {
  try {
    return normalizeQuestionnaireResponseState(
      JSON.parse(localStorage.getItem(questionnaireStorageKey) || "{}"),
    );
  } catch {
    return {};
  }
}

function saveQuestionnaireResponseStateLocally() {
  localStorage.setItem(questionnaireStorageKey, JSON.stringify(questionnaireResponseState));
}

function saveEditableResourceState() {
  localStorage.setItem(resourceStorageKey, JSON.stringify(editableResourceState));
}

function refreshResourceIndex() {
  const deletedIds = new Set(editableResourceState.deleted);
  const hiddenIds = new Set(editableResourceState.hidden);
  const editedBaseResources = baseResources
    .filter((resource) => !deletedIds.has(resource.id))
    .map((resource) => {
      const override = editableResourceState.overrides[resource.id];
      const mergedResource = override ? mergeEditableResource(resource, override) : normalizeEditableResource(resource);
      return { ...mergedResource, isHidden: hiddenIds.has(resource.id) };
    });
  const createdResources = editableResourceState.created
    .filter((resource) => !deletedIds.has(resource.id))
    .map((resource) => ({
      ...normalizeEditableResource(resource),
      isHidden: hiddenIds.has(resource.id),
    }));

  resources = [...editedBaseResources, ...createdResources];
  resourcesById = Object.fromEntries(resources.map((resource) => [resource.id, resource]));
}

function mergeEditableResource(resource, override) {
  return normalizeEditableResource({
    ...resource,
    ...override,
    id: resource.id,
    postNumber: resource.postNumber,
    importedComments: resource.importedComments ?? [],
    illustration: Object.prototype.hasOwnProperty.call(override, "illustration")
      ? override.illustration
      : resource.illustration,
    attachment: Object.prototype.hasOwnProperty.call(override, "attachment")
      ? override.attachment
      : resource.attachment,
  });
}

function normalizeEditableResource(resource) {
  const validDiseaseIds = Array.isArray(resource.diseaseIds)
    ? resource.diseaseIds.filter((id) => diseases.some((disease) => disease.id === id))
    : [];
  const diseaseIds = validDiseaseIds.length > 0
    ? validDiseaseIds
    : [diseases.some((disease) => disease.id === activeDiseaseId) ? activeDiseaseId : diseases[0].id];
  const section = resource.section || resourceSections[0];
  const format = resource.format === "questionnaire" ? "questionnaire" : "standard";

  return {
    ...resource,
    title: resource.title || "Nouvelle fiche",
    section,
    category: resource.category || getCategoryForSection(section),
    tagClass: resource.tagClass || getTagClassForSection(section),
    summary: resource.summary || "",
    body: resource.body || "",
    illustration: resource.illustration ?? null,
    attachment: resource.attachment ?? null,
    diseaseIds,
    importedComments: resource.importedComments ?? [],
    isHidden: Boolean(resource.isHidden),
    format,
    questionnaire: normalizeQuestionnaireDefinition(resource.questionnaire),
  };
}

function normalizeQuestionnaireDefinition(value) {
  const questions = Array.isArray(value?.questions)
    ? value.questions.map(normalizeQuestionnaireQuestion).filter(Boolean)
    : [];
  return { questions };
}

function normalizeQuestionnaireQuestion(question, index) {
  if (!question || typeof question !== "object") {
    return null;
  }

  const prompt = String(question.prompt || "").trim();
  if (!prompt) {
    return null;
  }

  const allowedTypes = new Set(["short", "long", "single", "scale"]);
  const type = allowedTypes.has(question.type) ? question.type : "short";
  const options = type === "single" && Array.isArray(question.options)
    ? question.options.map((option) => String(option).trim()).filter(Boolean)
    : [];

  return {
    id: String(question.id || `question-${index + 1}`),
    prompt,
    type,
    options,
    required: Boolean(question.required),
  };
}

function getTagClassForSection(section) {
  const normalized = normalizeText(section);

  if (normalized.includes("voix") || normalized.includes("parole")) return "voix";
  if (normalized.includes("fonctions cognitives :")) return "cognition";
  if (normalized.includes("maladie de huntington")) return "huntington";
  if (normalized.includes("outils")) return "quotidien";
  if (normalized.includes("deglutition")) return "deglutition";
  if (normalized.includes("autres ressources")) return "aidants";
  if (normalized.includes("experiences") || normalized.includes("partages")) return "experience";

  return "quotidien";
}

function getCategoryForSection(section) {
  const normalized = normalizeText(section);

  if (normalized.includes("voix") || normalized.includes("parole")) return "Voix et parole";
  if (normalized.includes("cognitives")) return "Cognition";
  if (normalized.includes("huntington")) return "Huntington";
  if (normalized.includes("outils")) return "Outils";
  if (normalized.includes("deglutition")) return "Déglutition";
  if (normalized.includes("experiences") || normalized.includes("partages")) return "Expériences";

  return "Ressources";
}

function getDiseaseResources(diseaseId) {
  return resources.filter(
    (resource) => resource.diseaseIds.includes(diseaseId) && (isAdminLoggedIn || !resource.isHidden),
  );
}

function renderTabs() {
  tabsNode.replaceChildren(
    ...navigationTabs.map((tab) => {
      const button = document.createElement("button");
      button.className = "tab-button";
      button.type = "button";
      button.id = `tab-${tab.id}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(tab.id === activeDiseaseId));
      button.setAttribute("aria-controls", "resourceGrid");
      button.textContent = tab.label;
      button.addEventListener("click", () => {
        if (activeModal) {
          closeResourceModal({ restoreFocus: false });
        }

        window.location.hash = tab.id;
      });
      return button;
    }),
  );

  if (activeModal) {
    updateViewerMenuOffset();
  }
}

function renderAdminControls() {
  if (!adminControlsNode) {
    adminControlsNode = document.createElement("div");
    adminControlsNode.className = "admin-controls";
    menuNode.append(adminControlsNode);
  }

  if (!isAdminLoggedIn) {
    const loginButton = document.createElement("button");
    loginButton.className = "admin-button";
    loginButton.type = "button";
    loginButton.textContent = "Connexion";
    loginButton.addEventListener("click", openLoginDialog);
    adminControlsNode.replaceChildren(loginButton);
    updateViewerMenuOffset();
    return;
  }

  const status = document.createElement("span");
  status.className = "admin-status";
  status.textContent = "Connectée : Audrey Fabre";

  const pendingCount = getTotalPendingCommentCount();
  const pendingIndicator = document.createElement("span");
  pendingIndicator.className = "admin-pending-indicator";
  pendingIndicator.textContent = formatPendingCommentCount(pendingCount);

  const pendingAppointmentCount = getPendingAppointmentRequests().length;
  const appointmentIndicator = document.createElement("button");
  appointmentIndicator.className = "admin-pending-indicator appointment-admin-indicator";
  appointmentIndicator.type = "button";
  appointmentIndicator.textContent = formatPendingAppointmentCount(pendingAppointmentCount);
  appointmentIndicator.addEventListener("click", () => {
    window.location.hash = appointmentTab.id;
  });

  const createButton = document.createElement("button");
  createButton.className = "admin-button admin-button-primary";
  createButton.type = "button";
  createButton.textContent = "Nouvelle fiche";
  createButton.addEventListener("click", () => openResourceEditor());

  const logoutButton = document.createElement("button");
  logoutButton.className = "admin-button";
  logoutButton.type = "button";
  logoutButton.textContent = "Se déconnecter";
  logoutButton.addEventListener("click", logoutAdmin);

  adminControlsNode.replaceChildren(status, pendingIndicator, appointmentIndicator, createButton, logoutButton);
  updateViewerMenuOffset();
}

function renderDisease() {
  panelNode.classList.toggle("is-content-page", activeDiseaseId === homeTab.id || activeDiseaseId === contactTab.id);

  if (activeDiseaseId === homeTab.id) {
    renderHomePanel();
    return;
  }

  if (activeDiseaseId === contactTab.id) {
    renderContactPanel();
    return;
  }

  if (activeDiseaseId === appointmentTab.id) {
    renderAppointmentPanel();
    return;
  }

  const disease = getActiveDisease();
  const diseaseResources = getDiseaseResources(disease.id);
  activeThemeFilter = normalizeThemeFilter(activeThemeFilter, diseaseResources);

  gridNode.className = "resource-theme-layout";
  panelNode.setAttribute("aria-label", `${diseaseResources.length} ressources - ${disease.label}`);
  const metric = createMetric(0, "ressources");
  metric.querySelector("strong").dataset.resourceCountValue = "true";
  metricsNode.replaceChildren(metric, createResourceFilters(diseaseResources));
  renderDiseaseResourceResults();
}

function renderHomePanel() {
  gridNode.className = "home-view";
  panelNode.setAttribute("aria-label", "Accueil");
  metricsNode.replaceChildren();

  const section = document.createElement("section");
  section.className = "home-content";

  const audience = document.createElement("p");
  audience.className = "content-page-kicker";
  audience.textContent = "Pour les patients et les aidants";

  const title = document.createElement("h2");
  title.textContent = siteContent.homeTitle;

  const body = document.createElement("p");
  body.className = "home-introduction";
  body.textContent = siteContent.homeBody;

  section.append(audience, title, body);

  if (isAdminLoggedIn) {
    const editButton = document.createElement("button");
    editButton.className = "admin-button admin-button-primary home-edit-button";
    editButton.type = "button";
    editButton.textContent = "Modifier le texte d'accueil";
    editButton.addEventListener("click", openHomeEditor);
    section.append(editButton);
  }

  section.append(createHomeVideoSection());

  gridNode.replaceChildren(section);
}

function createHomeVideoSection() {
  const section = document.createElement("section");
  section.className = "home-video-section";
  section.setAttribute("aria-labelledby", "homeVideoTitle");

  const title = document.createElement("h3");
  title.id = "homeVideoTitle";
  title.textContent = "Cognition et déglutition : comprendre et agir au quotidien";

  const player = document.createElement("iframe");
  player.className = "home-video-player";
  player.src = "https://www.youtube.com/embed/_7SIYMRzhdY?start=3881&end=5714&rel=0";
  player.title = "Cognition et déglutition : comprendre et agir au quotidien";
  player.loading = "lazy";
  player.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  player.referrerPolicy = "strict-origin-when-cross-origin";
  player.allowFullscreen = true;

  section.append(title, player);
  return section;
}

function renderContactPanel() {
  gridNode.className = "contact-view";
  panelNode.setAttribute("aria-label", "Contacter Audrey Fabre");
  metricsNode.replaceChildren();

  const section = document.createElement("section");
  section.className = "contact-content";

  const title = document.createElement("h2");
  title.textContent = "Contacter Audrey Fabre";

  const intro = document.createElement("p");
  intro.className = "contact-introduction";
  intro.textContent = "Utilisez ce formulaire pour envoyer un courriel à Audrey Fabre.";

  const emailText = document.createElement("p");
  emailText.className = "contact-email";
  emailText.textContent = contactEmail;

  const form = document.createElement("form");
  form.className = "contact-form";

  const nameField = createFieldLabel("Votre nom", "input", {
    type: "text",
    name: "contactName",
    autocomplete: "name",
    required: "true",
  });
  const emailField = createFieldLabel("Votre adresse e-mail", "input", {
    type: "email",
    name: "contactEmail",
    autocomplete: "email",
    required: "true",
  });
  const subjectField = createFieldLabel("Objet", "input", {
    type: "text",
    name: "contactSubject",
    required: "true",
  });
  const messageField = createFieldLabel("Votre message", "textarea", {
    name: "contactMessage",
    rows: "8",
    required: "true",
  });

  const honeypotField = createFieldLabel("Ne remplissez pas ce champ", "input", {
    type: "text",
    name: "website",
    autocomplete: "off",
    tabindex: "-1",
  });
  honeypotField.className = "contact-honeypot";
  honeypotField.setAttribute("aria-hidden", "true");

  const notice = document.createElement("p");
  notice.className = "contact-notice";
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.tabIndex = -1;
  notice.hidden = true;

  const submit = document.createElement("button");
  submit.className = "admin-button admin-button-primary contact-submit";
  submit.type = "submit";
  submit.textContent = "Envoyer le courriel";

  form.append(nameField, emailField, subjectField, messageField, honeypotField, notice, submit);
  form.addEventListener("submit", handleContactSubmit);
  section.append(title, intro, emailText, form);
  gridNode.replaceChildren(section);
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const name = String(formData.get("contactName") ?? "").trim();
  const email = String(formData.get("contactEmail") ?? "").trim();
  const subject = String(formData.get("contactSubject") ?? "").trim();
  const message = String(formData.get("contactMessage") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const notice = form.querySelector(".contact-notice");
  const stopLoading = startLoading("Envoi du courriel...");
  const stopSubmitLoading = setFormLoading(form, "Envoi...");
  notice.hidden = true;

  try {
    if (!apiEnabled) {
      throw new Error("API unavailable");
    }

    await apiRequest("/api/contact", {
      method: "POST",
      body: { name, email, subject, message, website },
    });
    form.reset();
    notice.className = "contact-notice is-success";
    notice.textContent = "Votre courriel a bien été envoyé à Audrey Fabre.";
    notice.hidden = false;
    notice.focus({ preventScroll: true });
  } catch (error) {
    notice.className = "contact-notice is-error";
    notice.textContent = error.status === 429
      ? "Trop de messages ont été envoyés récemment. Veuillez réessayer dans quelques minutes."
      : "Le courriel n'a pas pu être envoyé. Vérifiez votre connexion puis réessayez.";
    notice.hidden = false;
    notice.focus({ preventScroll: true });
  } finally {
    stopSubmitLoading();
    stopLoading();
  }
}

function openHomeEditor() {
  if (!isAdminLoggedIn) {
    openLoginDialog();
    return;
  }

  const form = document.createElement("form");
  form.className = "admin-form home-editor-form";

  const titleField = createFieldLabel("Titre de la page d'accueil", "input", {
    type: "text",
    name: "homeTitle",
    value: siteContent.homeTitle,
    maxlength: "200",
    required: "true",
  });
  const bodyField = createFieldLabel("Texte de la page d'accueil", "textarea", {
    name: "homeBody",
    rows: "12",
    maxlength: "6000",
    required: "true",
  });
  bodyField.querySelector("textarea").value = siteContent.homeBody;

  const error = document.createElement("p");
  error.className = "admin-error";
  error.hidden = true;
  const actions = createAdminFormActions("Enregistrer");

  form.append(titleField, bodyField, error, actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    const formData = new FormData(form);
    const nextContent = normalizeSiteContent({
      homeTitle: formData.get("homeTitle"),
      homeBody: formData.get("homeBody"),
    });
    const previousContent = { ...siteContent };
    const stopLoading = startLoading("Enregistrement de la page d'accueil...");
    const stopSubmitLoading = setFormLoading(form, "Enregistrement...");

    try {
      siteContent = nextContent;
      if (apiEnabled) {
        const result = await apiRequest("/api/site-content", {
          method: "PUT",
          auth: true,
          body: { siteContent },
        });
        siteContent = normalizeSiteContent(result.siteContent);
      } else {
        saveSiteContentLocally();
      }
      renderDisease();
      closeAdminDialog();
    } catch {
      siteContent = previousContent;
      error.hidden = false;
      error.textContent = "Le texte n'a pas pu être enregistré. Vérifiez la connexion puis réessayez.";
    } finally {
      stopSubmitLoading();
      stopLoading();
    }
  });

  openAdminDialog("Modifier la page d'accueil", form);
}

function createMetric(value, label) {
  const metric = document.createElement("div");
  metric.className = "metric";

  const strong = document.createElement("strong");
  strong.textContent = value;

  const span = document.createElement("span");
  span.textContent = label;

  metric.append(strong, span);
  return metric;
}

function createResourceFilters(resourcesForDisease) {
  const filters = document.createElement("form");
  filters.className = "resource-filters";
  filters.setAttribute("role", "search");
  filters.addEventListener("submit", (event) => event.preventDefault());

  const searchLabel = createFieldLabel("Rechercher une fiche", "input", {
    type: "search",
    name: "resourceSearch",
    placeholder: "Mot-clé, thème, contenu...",
    autocomplete: "off",
  });
  searchLabel.classList.add("resource-search-field");
  const searchInput = searchLabel.querySelector("input");
  searchInput.value = resourceSearchQuery;
  searchInput.addEventListener("input", (event) => {
    resourceSearchQuery = event.currentTarget.value;
    renderDiseaseResourceResults();
  });

  const themeOptions = [
    { value: "all", label: "Tous les thèmes" },
    ...getResourceThemes(resourcesForDisease).map((theme) => ({ value: theme, label: theme })),
  ];
  const themeLabel = createSelectLabel("Thème", "resourceTheme", themeOptions, activeThemeFilter);
  themeLabel.classList.add("resource-theme-field");
  themeLabel.querySelector("select").addEventListener("change", (event) => {
    activeThemeFilter = event.currentTarget.value;
    renderDiseaseResourceResults();
  });

  filters.append(searchLabel, themeLabel);
  return filters;
}

function renderDiseaseResourceResults() {
  if (activeDiseaseId === appointmentTab.id) {
    return;
  }

  const disease = getActiveDisease();
  const diseaseResources = getDiseaseResources(disease.id);
  activeThemeFilter = normalizeThemeFilter(activeThemeFilter, diseaseResources);
  const filteredResources = getFilteredDiseaseResources(diseaseResources);
  const countNode = metricsNode.querySelector("[data-resource-count-value]");

  if (countNode) {
    countNode.textContent = filteredResources.length;
  }

  panelNode.setAttribute(
    "aria-label",
    `${filteredResources.length} ressources affichées - ${disease.label}`,
  );

  if (filteredResources.length === 0) {
    const empty = document.createElement("section");
    empty.className = "resource-empty-state";

    const title = document.createElement("h2");
    title.textContent = "Aucune fiche trouvée";

    const text = document.createElement("p");
    text.textContent = "Essayez un autre mot-clé ou sélectionnez un autre thème.";

    empty.append(title, text);
    gridNode.replaceChildren(empty);
    return;
  }

  const groups = groupResourcesByTheme(filteredResources);
  gridNode.replaceChildren(
    ...groups.map(([theme, themeResources]) => createResourceThemeSection(theme, themeResources)),
  );
}

function getFilteredDiseaseResources(resourcesForDisease) {
  const searchTokens = normalizeText(resourceSearchQuery)
    .split(/\s+/)
    .filter(Boolean);

  return resourcesForDisease.filter((resource) => {
    const matchesTheme = activeThemeFilter === "all" || resource.section === activeThemeFilter;

    if (!matchesTheme) {
      return false;
    }

    if (searchTokens.length === 0) {
      return true;
    }

    const searchableText = normalizeText([
      resource.title,
      resource.section,
      resource.category,
      resource.summary,
      resource.body,
      resource.questionnaire?.questions
        ?.flatMap((question) => [question.prompt, ...(question.options ?? [])])
        .join(" "),
      resource.attachment?.label,
      resource.attachment?.url,
    ].filter(Boolean).join(" "));

    return searchTokens.every((token) => searchableText.includes(token));
  });
}

function createResourceThemeSection(theme, themeResources) {
  const section = document.createElement("details");
  section.className = "resource-theme-section";
  section.open = Boolean(resourceSearchQuery.trim()) || activeThemeFilter !== "all";

  const header = document.createElement("summary");
  header.className = "resource-theme-summary";

  const title = document.createElement("h2");
  title.textContent = theme;

  const count = document.createElement("p");
  count.textContent = formatResourceCount(themeResources.length);

  header.append(title, count);

  const list = document.createElement("div");
  list.className = "resource-theme-list";
  if (themeResources.length > 0) {
    list.append(...themeResources.map((resource) => createResourceCard(resource)));
  } else {
    const empty = document.createElement("p");
    empty.className = "resource-theme-empty";
    empty.textContent = "Aucune fiche dans ce thème pour le moment.";
    list.append(empty);
  }

  section.append(header, list);
  return section;
}

function groupResourcesByTheme(resourcesToGroup) {
  const grouped = new Map();

  getResourceThemes(resourcesToGroup).forEach((theme) => {
    grouped.set(theme, []);
  });

  resourcesToGroup.forEach((resource) => {
    if (!grouped.has(resource.section)) {
      grouped.set(resource.section, []);
    }

    grouped.get(resource.section).push(resource);
  });

  const showEmptySections = !resourceSearchQuery.trim() && activeThemeFilter === "all";
  return [...grouped.entries()].filter(
    ([theme, themeResources]) =>
      themeResources.length > 0 || (showEmptySections && alwaysVisibleResourceSections.includes(theme)),
  );
}

function getResourceThemes(resourcesForDisease) {
  return [
    ...new Set([
      ...resourcesForDisease.map((resource) => resource.section || resourceSections[0]),
      ...alwaysVisibleResourceSections,
    ]),
  ].sort(compareResourceThemes);
}

function compareResourceThemes(first, second) {
  const firstIndex = resourceSections.indexOf(first);
  const secondIndex = resourceSections.indexOf(second);

  if (firstIndex !== -1 || secondIndex !== -1) {
    if (firstIndex === -1) return 1;
    if (secondIndex === -1) return -1;
    return firstIndex - secondIndex;
  }

  return first.localeCompare(second, "fr");
}

function normalizeThemeFilter(theme, resourcesForDisease) {
  if (theme === "all") {
    return theme;
  }

  return getResourceThemes(resourcesForDisease).includes(theme) ? theme : "all";
}

function renderAppointmentPanel() {
  const availableSlots = getAvailableAppointmentSlots();
  const pendingRequests = getPendingAppointmentRequests();

  gridNode.className = "appointment-view";
  panelNode.setAttribute("aria-label", "Prise de rendez-vous");
  metricsNode.replaceChildren(
    createMetric(availableSlots.length, "créneaux libres"),
    ...(isAdminLoggedIn ? [createMetric(pendingRequests.length, "demandes à valider")] : []),
  );

  const shell = document.createElement("div");
  shell.className = "appointment-shell";

  const header = document.createElement("section");
  header.className = "appointment-heading";

  const title = document.createElement("h2");
  title.textContent = "Prise de rendez-vous";

  const text = document.createElement("p");
  text.textContent = isAdminLoggedIn
    ? "Gérez les demandes de rendez-vous et les disponibilités proposées aux patients."
    : "Choisissez un créneau disponible. La demande sera confirmée après validation par Audrey Fabre.";

  header.append(title, text);

  if (appointmentNotice) {
    const notice = document.createElement("p");
    notice.className = "appointment-notice";
    notice.textContent = appointmentNotice;
    header.append(notice);
  }

  shell.append(header);

  if (isAdminLoggedIn) {
    shell.append(createAppointmentAdminPanel());
  }

  shell.append(createAppointmentCalendar());
  gridNode.replaceChildren(shell);
}

function createAppointmentAdminPanel() {
  const section = document.createElement("section");
  section.className = "appointment-admin-panel";

  const title = document.createElement("h2");
  title.textContent = "Gestion des rendez-vous";

  const layout = document.createElement("div");
  layout.className = "appointment-admin-layout";
  layout.append(createAppointmentRequestsPanel(), createAvailabilityManager());

  section.append(title, layout);
  return section;
}

function createAppointmentRequestsPanel() {
  const panel = document.createElement("section");
  panel.className = "appointment-admin-card";

  const title = document.createElement("h3");
  title.textContent = "Demandes à valider";
  panel.append(title);

  const pendingRequests = getPendingAppointmentRequests();

  if (pendingRequests.length === 0) {
    const empty = document.createElement("p");
    empty.className = "appointment-empty";
    empty.textContent = "Aucune demande de rendez-vous en attente.";
    panel.append(empty);
  } else {
    const list = document.createElement("div");
    list.className = "appointment-request-list";
    pendingRequests.forEach((request) => list.append(createAppointmentRequestItem(request)));
    panel.append(list);
  }

  const approvedRequests = getApprovedAppointmentRequests().slice(0, 4);
  if (approvedRequests.length > 0) {
    const approvedTitle = document.createElement("h3");
    approvedTitle.textContent = "Rendez-vous validés";

    const approvedList = document.createElement("div");
    approvedList.className = "appointment-request-list";
    approvedRequests.forEach((request) => approvedList.append(createAppointmentRequestItem(request)));
    panel.append(approvedTitle, approvedList);
  }

  return panel;
}

function createAppointmentRequestItem(request) {
  const slot = getAppointmentSlotById(request.slotId);
  const article = document.createElement("article");
  article.className = `appointment-request-item appointment-request-${request.status}`;

  const title = document.createElement("h4");
  title.textContent = slot ? getSlotLabel(slot) : "Créneau supprimé";

  const patient = document.createElement("p");
  patient.innerHTML = "";
  patient.append(createStrongText(request.patientName || "Patient non renseigné"));

  const contact = document.createElement("p");
  contact.textContent = [request.phone, request.email].filter(Boolean).join(" · ") || "Contact non renseigné";

  const reason = document.createElement("p");
  reason.textContent = request.reason || "Aucun motif précisé.";

  const status = document.createElement("p");
  status.className = "appointment-request-status";
  status.textContent = request.status === "approved" ? "Validé" : "En attente";

  article.append(title, patient, contact, reason, status);

  if (request.attachments?.length > 0) {
    article.append(createAppointmentAttachmentList(request.attachments));
  }

  if (request.status === "pending") {
    const actions = document.createElement("div");
    actions.className = "appointment-actions";

    const approve = document.createElement("button");
    approve.className = "admin-button admin-button-primary";
    approve.type = "button";
    approve.textContent = "Valider";
    approve.addEventListener("click", () => approveAppointmentRequest(request.id, approve));

    const decline = document.createElement("button");
    decline.className = "admin-button";
    decline.type = "button";
    decline.textContent = "Refuser";
    decline.addEventListener("click", () => declineAppointmentRequest(request.id, decline));

    actions.append(approve, decline);
    article.append(actions);
  }

  return article;
}

function createAppointmentAttachmentList(attachments) {
  const section = document.createElement("div");
  section.className = "appointment-attachments";

  const title = document.createElement("p");
  title.className = "appointment-attachments-title";
  title.textContent = "Pièces jointes";

  const list = document.createElement("ul");
  attachments.forEach((attachment) => {
    const item = document.createElement("li");
    item.append(createAppointmentAttachmentLink(attachment));
    list.append(item);
  });

  section.append(title, list);
  return section;
}

function createAppointmentAttachmentLink(attachment) {
  const link = document.createElement("a");
  link.href = attachment.url;
  link.textContent = attachment.label || "Pièce jointe";

  if (attachment.storage === "browser") {
    link.download = attachment.label || "piece-jointe";
  } else {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  return link;
}

function createAvailabilityManager() {
  const panel = document.createElement("section");
  panel.className = "appointment-admin-card";

  const title = document.createElement("h3");
  title.textContent = "Disponibilités";

  panel.append(title, createAvailabilityForm());

  const slots = getFutureAppointmentSlots();
  if (slots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "appointment-empty";
    empty.textContent = "Aucun créneau futur n'est disponible.";
    panel.append(empty);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "availability-list";
  slots.forEach((slot) => list.append(createAvailabilityItem(slot)));
  panel.append(list);
  return panel;
}

function createAvailabilityForm() {
  const form = document.createElement("form");
  form.className = "availability-form";

  const date = createFieldLabel("Date", "input", {
    type: "date",
    name: "date",
    min: getTodayDateString(),
    required: "true",
  });

  const start = createFieldLabel("Heure", "input", {
    type: "time",
    name: "start",
    value: "09:00",
    required: "true",
  });

  const duration = createSelectLabel(
    "Durée",
    "duration",
    [
      { value: "30", label: "30 minutes" },
      { value: "45", label: "45 minutes" },
      { value: "60", label: "1 heure" },
    ],
    "45",
  );

  const error = document.createElement("p");
  error.className = "admin-error";
  error.hidden = true;

  const button = document.createElement("button");
  button.className = "admin-button admin-button-primary";
  button.type = "submit";
  button.textContent = "Ajouter le créneau";

  form.append(date, start, duration, error, button);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;

    const formData = new FormData(form);
    const dateValue = String(formData.get("date") ?? "");
    const startValue = String(formData.get("start") ?? "");
    const durationValue = Number(formData.get("duration") ?? 45);

    if (!dateValue || !startValue) {
      error.hidden = false;
      error.textContent = "La date et l'heure sont obligatoires.";
      return;
    }

    const slot = createAppointmentSlot(dateValue, startValue, durationValue);
    if (!isFutureSlot(slot)) {
      error.hidden = false;
      error.textContent = "Choisissez un créneau à venir.";
      return;
    }

    const duplicate = appointmentState.slots.some(
      (existingSlot) => existingSlot.date === slot.date && existingSlot.start === slot.start,
    );
    if (duplicate) {
      error.hidden = false;
      error.textContent = "Ce créneau existe déjà.";
      return;
    }

    appointmentState.slots.push(slot);
    const stopLoading = startLoading("Ajout du créneau...");
    const stopSubmitLoading = setFormLoading(form, "Ajout...");

    try {
      await persistAppointmentState();
    } catch {
      appointmentState.slots = appointmentState.slots.filter((item) => item.id !== slot.id);
      error.hidden = false;
      error.textContent = "Le créneau n'a pas pu être sauvegardé.";
      return;
    } finally {
      stopSubmitLoading();
      stopLoading();
    }

    appointmentNotice = "Le créneau a été ajouté.";
    renderAdminControls();
    renderDisease();
  });

  return form;
}

function createAvailabilityItem(slot) {
  const item = document.createElement("article");
  item.className = "availability-item";
  if (!slot.enabled) {
    item.classList.add("is-disabled-slot");
  }

  const label = document.createElement("p");
  label.className = "availability-label";
  label.textContent = getSlotLabel(slot);

  const status = document.createElement("p");
  status.className = "availability-status";
  status.textContent = getSlotStatusLabel(slot);

  const actions = document.createElement("div");
  actions.className = "appointment-actions";

  const toggle = document.createElement("button");
  toggle.className = "admin-button";
  toggle.type = "button";
  toggle.textContent = slot.enabled ? "Rendre indisponible" : "Rendre disponible";
  toggle.addEventListener("click", () => toggleAppointmentSlot(slot.id, toggle));

  const remove = document.createElement("button");
  remove.className = "admin-button admin-danger-button";
  remove.type = "button";
  remove.textContent = "Supprimer";
  remove.addEventListener("click", () => deleteAppointmentSlot(slot.id, remove));

  actions.append(toggle, remove);
  item.append(label, status, actions);
  return item;
}

function createAppointmentCalendar() {
  const section = document.createElement("section");
  section.className = "appointment-calendar";

  const title = document.createElement("h2");
  title.textContent = "Prendre rendez-vous";

  const help = document.createElement("p");
  help.className = "appointment-help";
  help.textContent = isAdminLoggedIn
    ? "Vue des créneaux proposés aux patients."
    : "Les créneaux indisponibles ou déjà demandés ne peuvent pas être sélectionnés.";

  section.append(title, help);

  const slots = getFutureAppointmentSlots();
  if (slots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "appointment-empty";
    empty.textContent = "Aucun créneau n'est proposé pour le moment.";
    section.append(empty);
    return section;
  }

  const days = groupSlotsByDate(slots);
  const daysGrid = document.createElement("div");
  daysGrid.className = "appointment-days";

  days.forEach(([date, daySlots]) => {
    const day = document.createElement("article");
    day.className = "appointment-day";

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = formatAppointmentDate(date);

    const slotGrid = document.createElement("div");
    slotGrid.className = "appointment-slots";
    daySlots.forEach((slot) => slotGrid.append(createAppointmentSlotButton(slot)));

    day.append(dayTitle, slotGrid);
    daysGrid.append(day);
  });

  section.append(daysGrid);
  return section;
}

function createAppointmentSlotButton(slot) {
  const request = getActiveAppointmentRequestForSlot(slot.id);
  const bookable = isSlotBookable(slot);
  const button = document.createElement("button");
  button.className = "appointment-slot";
  button.type = "button";
  button.disabled = !bookable || isAdminLoggedIn;
  button.setAttribute("aria-label", `${getSlotLabel(slot)} - ${getSlotStatusLabel(slot)}`);

  if (!slot.enabled) {
    button.classList.add("is-disabled-slot");
  } else if (request?.status === "approved") {
    button.classList.add("is-approved-slot");
  } else if (request?.status === "pending") {
    button.classList.add("is-pending-slot");
  }

  const time = document.createElement("span");
  time.className = "slot-time";
  time.textContent = `${slot.start} - ${slot.end}`;

  const status = document.createElement("span");
  status.className = "slot-status";
  status.textContent = getSlotStatusLabel(slot);

  button.append(time, status);

  if (bookable && !isAdminLoggedIn) {
    button.addEventListener("click", () => openAppointmentRequestDialog(slot.id));
  }

  return button;
}

function openAppointmentRequestDialog(slotId) {
  const slot = getAppointmentSlotById(slotId);

  if (!slot || !isSlotBookable(slot)) {
    return;
  }

  const form = document.createElement("form");
  form.className = "admin-form appointment-request-form";

  const intro = document.createElement("p");
  intro.className = "admin-help";
  intro.textContent = `Demande pour le ${getSlotLabel(slot)}. Audrey Fabre devra valider ce rendez-vous.`;

  const name = createFieldLabel("Nom", "input", {
    type: "text",
    name: "patientName",
    autocomplete: "name",
    required: "true",
  });

  const phone = createFieldLabel("Téléphone", "input", {
    type: "tel",
    name: "phone",
    autocomplete: "tel",
  });

  const email = createFieldLabel("E-mail", "input", {
    type: "email",
    name: "email",
    autocomplete: "email",
  });

  const reason = createFieldLabel("Motif ou message", "textarea", {
    name: "reason",
    rows: "5",
    placeholder: "Quelques informations utiles pour préparer le rendez-vous...",
  });

  const attachments = createFieldLabel("Pièces jointes", "input", {
    type: "file",
    name: "appointmentFiles",
    accept: "image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
    multiple: "true",
  });

  const attachmentsHelp = document.createElement("p");
  attachmentsHelp.className = "admin-help";
  attachmentsHelp.textContent = apiEnabled
    ? "Vous pouvez ajouter plusieurs fichiers utiles à la demande. Total maximum : 3 Mo."
    : "Vous pouvez ajouter plusieurs fichiers utiles à la demande. Total maximum pour cette maquette locale : 3 Mo.";

  const error = document.createElement("p");
  error.className = "admin-error";
  error.hidden = true;

  const actions = createAdminFormActions("Envoyer la demande");
  form.append(intro, name, phone, email, reason, attachments, attachmentsHelp, error, actions);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;

    const formData = new FormData(form);
    const patientName = String(formData.get("patientName") ?? "").trim();
    const phoneValue = String(formData.get("phone") ?? "").trim();
    const emailValue = String(formData.get("email") ?? "").trim();
    const files = formData
      .getAll("appointmentFiles")
      .filter((file) => file instanceof File && file.name);

    if (!patientName) {
      error.hidden = false;
      error.textContent = "Le nom est obligatoire.";
      return;
    }

    if (!phoneValue && !emailValue) {
      error.hidden = false;
      error.textContent = "Ajoutez un téléphone ou un e-mail pour être recontacté.";
      return;
    }

    if (!isSlotBookable(slot)) {
      error.hidden = false;
      error.textContent = "Ce créneau n'est plus disponible.";
      return;
    }

    if (getFilesTotalSize(files) > maxLocalAttachmentBytes) {
      error.hidden = false;
      error.textContent = "Les pièces jointes sont trop lourdes. Total maximum : 3 Mo.";
      return;
    }

    const stopLoading = startLoading("Envoi de la demande de rendez-vous...");
    const stopSubmitLoading = setFormLoading(form, "Envoi...");
    let requestAttachments = [];
    try {
      requestAttachments = await buildAppointmentAttachments(files);
    } catch {
      error.hidden = false;
      error.textContent = "Une pièce jointe n'a pas pu être lue. Essayez un autre fichier.";
      return;
    } finally {
      stopSubmitLoading();
      stopLoading();
    }

    const request = {
      id: createCommentId(),
      slotId,
      patientName,
      phone: phoneValue,
      email: emailValue,
      reason: String(formData.get("reason") ?? "").trim(),
      attachments: requestAttachments,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const stopSaveLoading = startLoading("Enregistrement de la demande...");
    const stopSaveSubmitLoading = setFormLoading(form, "Enregistrement...");

    if (apiEnabled) {
      try {
        await apiRequest("/api/appointments/requests", {
          method: "POST",
          body: { request },
        });
        await loadBackendState({ silent: true });
      } catch (apiError) {
        error.hidden = false;
        error.textContent = apiError.status === 409
          ? "Ce créneau n'est plus disponible. Choisissez un autre horaire."
          : "La demande n'a pas pu être envoyée. Réessayez dans un instant.";
        return;
      } finally {
        stopSaveSubmitLoading();
        stopSaveLoading();
      }
    } else {
      const previousRequests = [...appointmentState.requests];
      appointmentState.requests.unshift(request);

      try {
        saveAppointmentState();
      } catch {
        appointmentState.requests = previousRequests;
        error.hidden = false;
        error.textContent =
          "La sauvegarde locale a échoué. Retirez une pièce jointe ou utilisez des fichiers plus légers.";
        return;
      } finally {
        stopSaveSubmitLoading();
        stopSaveLoading();
      }
    }

    appointmentNotice = "Votre demande a bien été envoyée. Audrey Fabre devra la valider.";
    closeAdminDialog();
    renderAdminControls();
    renderDisease();
  });

  openAdminDialog("Demande de rendez-vous", form);
}

async function buildAppointmentAttachments(files) {
  return Promise.all(
    files.map(async (file) => ({
      label: file.name,
      url: await readFileAsDataUrl(file),
      kind: getFileKind(file),
      local: true,
      storage: "browser",
      size: file.size,
    })),
  );
}

function getFilesTotalSize(files) {
  return files.reduce((total, file) => total + file.size, 0);
}

function loadAppointmentState() {
  const fallback = createDefaultAppointmentState();
  const raw = localStorage.getItem(appointmentStorageKey);

  if (!raw) {
    return fallback;
  }

  try {
    return normalizeAppointmentState(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function saveAppointmentState() {
  localStorage.setItem(appointmentStorageKey, JSON.stringify(appointmentState));
}

async function persistAppointmentState() {
  if (apiEnabled) {
    await apiRequest("/api/appointment-state", {
      method: "PUT",
      auth: true,
      body: { appointmentState },
    });
    await loadBackendState({ silent: true });
    return;
  }

  saveAppointmentState();
}

function normalizeAppointmentState(state) {
  const slots = Array.isArray(state?.slots)
    ? state.slots.map(normalizeAppointmentSlot).filter(Boolean)
    : [];
  const requests = Array.isArray(state?.requests)
    ? state.requests.map(normalizeAppointmentRequest).filter(Boolean)
    : [];

  return { slots, requests };
}

function normalizeAppointmentSlot(slot) {
  if (!slot || typeof slot !== "object" || !slot.date || !slot.start) {
    return null;
  }

  return {
    id: slot.id || `slot-${slot.date}-${String(slot.start).replace(":", "")}`,
    date: String(slot.date),
    start: String(slot.start),
    end: slot.end || addMinutesToTime(String(slot.start), 45),
    enabled: slot.enabled !== false,
  };
}

function normalizeAppointmentRequest(request) {
  if (!request || typeof request !== "object" || !request.slotId) {
    return null;
  }

  const status = ["pending", "approved", "declined"].includes(request.status)
    ? request.status
    : "pending";

  return {
    id: request.id || createCommentId(),
    slotId: String(request.slotId),
    patientName: String(request.patientName ?? "").trim() || "Patient non renseigné",
    phone: String(request.phone ?? "").trim(),
    email: String(request.email ?? "").trim(),
    reason: String(request.reason ?? "").trim(),
    attachments: Array.isArray(request.attachments)
      ? request.attachments.map(normalizeAttachmentRecord).filter(Boolean)
      : [],
    status,
    createdAt: request.createdAt || new Date().toISOString(),
    approvedAt: request.approvedAt || "",
    declinedAt: request.declinedAt || "",
  };
}

function normalizeAttachmentRecord(attachment) {
  if (!attachment || typeof attachment !== "object" || !attachment.url) {
    return null;
  }

  return {
    label: String(attachment.label ?? "").trim() || "Pièce jointe",
    url: String(attachment.url),
    kind: String(attachment.kind ?? ""),
    local: Boolean(attachment.local),
    storage: attachment.storage === "browser" ? "browser" : "",
    size: Number(attachment.size ?? 0),
  };
}

function createDefaultAppointmentState() {
  const slots = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 28; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const day = date.getDay();
    const dateValue = formatDateInput(date);

    if (day === 1 || day === 3) {
      slots.push(
        createAppointmentSlot(dateValue, "09:00", 45),
        createAppointmentSlot(dateValue, "10:30", 45),
        createAppointmentSlot(dateValue, "14:00", 45),
      );
    }

    if (day === 5) {
      slots.push(createAppointmentSlot(dateValue, "11:00", 45));
    }
  }

  return { slots, requests: [] };
}

function createAppointmentSlot(date, start, duration) {
  return {
    id: `slot-${date}-${String(start).replace(":", "")}-${createCommentId().slice(0, 8)}`,
    date,
    start,
    end: addMinutesToTime(start, duration),
    enabled: true,
  };
}

function getFutureAppointmentSlots() {
  return appointmentState.slots
    .filter(isFutureSlot)
    .sort(compareAppointmentSlots);
}

function getAvailableAppointmentSlots() {
  return getFutureAppointmentSlots().filter(isSlotBookable);
}

function getPendingAppointmentRequests() {
  return appointmentState.requests
    .filter((request) => request.status === "pending")
    .sort(compareAppointmentRequests);
}

function getApprovedAppointmentRequests() {
  return appointmentState.requests
    .filter((request) => request.status === "approved")
    .filter((request) => {
      const slot = getAppointmentSlotById(request.slotId);
      return slot ? isFutureSlot(slot) : true;
    })
    .sort(compareAppointmentRequests);
}

function getAppointmentSlotById(slotId) {
  return appointmentState.slots.find((slot) => slot.id === slotId) ?? null;
}

function getActiveAppointmentRequestForSlot(slotId) {
  const slotRequests = appointmentState.requests.filter(
    (request) => request.slotId === slotId && request.status !== "declined",
  );

  return (
    slotRequests.find((request) => request.status === "approved") ??
    slotRequests.find((request) => request.status === "pending") ??
    null
  );
}

function isSlotBookable(slot) {
  return Boolean(slot.enabled && isFutureSlot(slot) && !getActiveAppointmentRequestForSlot(slot.id));
}

function isFutureSlot(slot) {
  return getSlotDateTime(slot).getTime() > Date.now();
}

function getSlotDateTime(slot) {
  return new Date(`${slot.date}T${slot.start}:00`);
}

function compareAppointmentSlots(first, second) {
  return getSlotDateTime(first).getTime() - getSlotDateTime(second).getTime();
}

function compareAppointmentRequests(first, second) {
  const firstSlot = getAppointmentSlotById(first.slotId);
  const secondSlot = getAppointmentSlotById(second.slotId);
  const firstTime = firstSlot ? getSlotDateTime(firstSlot).getTime() : Number.MAX_SAFE_INTEGER;
  const secondTime = secondSlot ? getSlotDateTime(secondSlot).getTime() : Number.MAX_SAFE_INTEGER;
  return firstTime - secondTime;
}

function groupSlotsByDate(slots) {
  const groups = new Map();

  slots.forEach((slot) => {
    if (!groups.has(slot.date)) {
      groups.set(slot.date, []);
    }

    groups.get(slot.date).push(slot);
  });

  return [...groups.entries()];
}

async function approveAppointmentRequest(requestId, control = null) {
  const request = appointmentState.requests.find((item) => item.id === requestId);

  if (!request) {
    return;
  }

  const stopLoading = startLoading("Validation du rendez-vous...");
  const stopControlLoading = setControlLoading(control, "Validation...");
  const previousState = cloneJson(appointmentState);
  appointmentState.requests = appointmentState.requests.map((item) => {
    if (item.id === requestId) {
      return { ...item, status: "approved", approvedAt: new Date().toISOString() };
    }

    if (item.slotId === request.slotId && item.status === "pending") {
      return { ...item, status: "declined", declinedAt: new Date().toISOString() };
    }

    return item;
  });

  appointmentNotice = "La demande de rendez-vous a été validée.";
  try {
    await persistAppointmentState();
  } catch {
    appointmentState = previousState;
    appointmentNotice = "La demande n'a pas pu être validée.";
  }
  renderAdminControls();
  renderDisease();
  stopControlLoading();
  stopLoading();
}

async function declineAppointmentRequest(requestId, control = null) {
  const stopLoading = startLoading("Refus du rendez-vous...");
  const stopControlLoading = setControlLoading(control, "Refus...");
  const previousState = cloneJson(appointmentState);
  appointmentState.requests = appointmentState.requests.map((request) =>
    request.id === requestId
      ? { ...request, status: "declined", declinedAt: new Date().toISOString() }
      : request,
  );

  appointmentNotice = "La demande de rendez-vous a été refusée.";
  try {
    await persistAppointmentState();
  } catch {
    appointmentState = previousState;
    appointmentNotice = "La demande n'a pas pu être refusée.";
  }
  renderAdminControls();
  renderDisease();
  stopControlLoading();
  stopLoading();
}

async function toggleAppointmentSlot(slotId, control = null) {
  const stopLoading = startLoading("Mise à jour de la disponibilité...");
  const stopControlLoading = setControlLoading(control, "Mise à jour...");
  const previousState = cloneJson(appointmentState);
  appointmentState.slots = appointmentState.slots.map((slot) =>
    slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot,
  );

  appointmentNotice = "La disponibilité a été mise à jour.";
  try {
    await persistAppointmentState();
  } catch {
    appointmentState = previousState;
    appointmentNotice = "La disponibilité n'a pas pu être mise à jour.";
  }
  renderAdminControls();
  renderDisease();
  stopControlLoading();
  stopLoading();
}

async function deleteAppointmentSlot(slotId, control = null) {
  const slot = getAppointmentSlotById(slotId);

  if (!slot) {
    return;
  }

  const confirmed = window.confirm(`Supprimer ce créneau ?\n\n${getSlotLabel(slot)}`);
  if (!confirmed) {
    return;
  }

  const stopLoading = startLoading("Suppression du créneau...");
  const stopControlLoading = setControlLoading(control, "Suppression...");
  const previousState = cloneJson(appointmentState);
  appointmentState.slots = appointmentState.slots.filter((item) => item.id !== slotId);
  appointmentState.requests = appointmentState.requests.map((request) =>
    request.slotId === slotId && request.status === "pending"
      ? { ...request, status: "declined", declinedAt: new Date().toISOString() }
      : request,
  );

  appointmentNotice = "Le créneau a été supprimé.";
  try {
    await persistAppointmentState();
  } catch {
    appointmentState = previousState;
    appointmentNotice = "Le créneau n'a pas pu être supprimé.";
  }
  renderAdminControls();
  renderDisease();
  stopControlLoading();
  stopLoading();
}

function getSlotStatusLabel(slot) {
  const request = getActiveAppointmentRequestForSlot(slot.id);

  if (!slot.enabled) {
    return "indisponible";
  }

  if (request?.status === "approved") {
    return "réservé";
  }

  if (request?.status === "pending") {
    return "demande en attente";
  }

  return "disponible";
}

function getSlotLabel(slot) {
  return `${formatAppointmentDate(slot.date)} de ${slot.start} à ${slot.end}`;
}

function formatPendingAppointmentCount(count) {
  return `${count} ${count > 1 ? "demandes RDV à valider" : "demande RDV à valider"}`;
}

function formatAppointmentDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getTodayDateString() {
  return formatDateInput(new Date());
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMinutesToTime(time, minutes) {
  const [hours = "0", rawMinutes = "0"] = String(time).split(":");
  const date = new Date(2000, 0, 1, Number(hours), Number(rawMinutes) + Number(minutes));
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function createStrongText(value) {
  const strong = document.createElement("strong");
  strong.textContent = value;
  return strong;
}

function openLoginDialog() {
  const form = document.createElement("form");
  form.className = "admin-form";

  const error = document.createElement("p");
  error.className = "admin-error";
  error.hidden = true;

  const loginField = createFieldLabel("Pseudo", "input", {
    type: "text",
    name: "login",
    autocomplete: "username",
    required: "true",
  });

  const passwordField = createFieldLabel("Mot de passe", "input", {
    type: "password",
    name: "password",
    autocomplete: "current-password",
    required: "true",
  });

  const actions = createAdminFormActions("Se connecter");

  form.append(loginField, passwordField, error, actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const login = String(formData.get("login") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const stopLoading = startLoading("Connexion en cours...");
    const stopSubmitLoading = setFormLoading(form, "Connexion...");

    try {
      if (apiEnabled) {
        try {
          const session = await apiRequest("/api/auth/login", {
            method: "POST",
            body: { login, password },
          });
          adminAuthToken = session.token || "";
          sessionStorage.setItem(authStorageKey, adminAuthToken);
          const loaded = await loadBackendState({ silent: true });
          if (!loaded || !adminAuthToken) {
            throw new Error("Session invalide");
          }
        } catch {
          error.hidden = false;
          error.textContent = "Identifiant ou mot de passe incorrect.";
          return;
        }
      } else if (login !== adminLogin || !(await verifyLocalAdminPassword(password))) {
        error.hidden = false;
        error.textContent = "Identifiant ou mot de passe incorrect.";
        return;
      }

      isAdminLoggedIn = true;
      if (!apiEnabled) {
        sessionStorage.setItem(authStorageKey, "true");
      }
      resetViewAfterSessionChange();
    } finally {
      stopSubmitLoading();
      stopLoading();
    }
  });

  openAdminDialog("Connexion", form);
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  adminAuthToken = "";
  if (apiEnabled) {
    questionnaireResponseState = {};
  }
  sessionStorage.removeItem(authStorageKey);
  resetViewAfterSessionChange();
}

function openResourceEditor(resourceId = "") {
  if (!isAdminLoggedIn) {
    openLoginDialog();
    return;
  }

  const isNew = !resourceId;
  const resource = isNew ? createDraftResource() : resourcesById[resourceId];

  if (!resource) {
    return;
  }

  const form = createResourceForm(resource, { isNew });
  openAdminDialog(isNew ? "Nouvelle fiche" : "Modifier la fiche", form);
}

function createDraftResource() {
  return normalizeEditableResource({
    id: "",
    postNumber: Date.now(),
    title: "",
    section: resourceSections[0],
    category: getCategoryForSection(resourceSections[0]),
    tagClass: getTagClassForSection(resourceSections[0]),
    summary: "",
    body: "",
    illustration: null,
    attachment: null,
    diseaseIds: [diseases.some((disease) => disease.id === activeDiseaseId) ? activeDiseaseId : diseases[0].id],
    importedComments: [],
    format: "standard",
    questionnaire: { questions: [] },
  });
}

function createResourceForm(resource, options = {}) {
  const { isNew = false } = options;
  const form = document.createElement("form");
  form.className = "admin-form resource-editor-form";

  const intro = document.createElement("p");
  intro.className = "admin-help";
  intro.textContent = apiEnabled
    ? "Les modifications sont sauvegardées dans la base du site."
    : "Les modifications sont sauvegardées localement sur cet ordinateur pour cette maquette.";

  const titleField = createFieldLabel("Titre de la fiche", "input", {
    type: "text",
    name: "title",
    value: resource.title,
    required: "true",
  });

  const formatField = createSelectLabel(
    "Format de la fiche",
    "format",
    [
      { value: "standard", label: "Fiche de ressource" },
      { value: "questionnaire", label: "Questionnaire anonyme" },
    ],
    resource.format,
  );

  const sectionField = createThemeFields(resource.section);

  const diseasesField = createDiseaseCheckboxes(resource.diseaseIds);
  const visibilityField = createVisibilityFields(resource);

  const summaryField = createFieldLabel("Résumé visible sur la ligne", "textarea", {
    name: "summary",
    rows: "4",
    placeholder: "Texte court affiché sur la page principale...",
  });
  summaryField.querySelector("textarea").value = resource.summary ?? "";

  const bodyField = createFieldLabel("Contenu complet de la fiche", "textarea", {
    name: "body",
    rows: "8",
    placeholder: "Texte complet affiché quand la fiche est ouverte...",
  });
  bodyField.querySelector("textarea").value = resource.body ?? "";

  const questionnaireField = createQuestionnaireEditor(resource.questionnaire);
  const formatSelect = formatField.querySelector("select");
  const updateFormatFields = () => {
    const isQuestionnaire = formatSelect.value === "questionnaire";
    questionnaireField.hidden = !isQuestionnaire;
    bodyField.querySelector("span").textContent = isQuestionnaire
      ? "Texte d'introduction du questionnaire"
      : "Contenu complet de la fiche";
  };
  formatSelect.addEventListener("change", updateFormatFields);
  updateFormatFields();

  const illustrationField = createIllustrationFields(resource, { isNew });
  const attachmentField = createAttachmentFields(resource, { isNew });
  const error = document.createElement("p");
  error.className = "admin-error";
  error.hidden = true;

  const actions = createAdminFormActions(isNew ? "Créer la fiche" : "Enregistrer", {
    onDelete: isNew ? null : (event) => requestDeleteResource(resource.id, event.currentTarget),
  });

  form.append(
    intro,
    titleField,
    formatField,
    sectionField,
    diseasesField,
    visibilityField,
    summaryField,
    illustrationField,
    bodyField,
    questionnaireField,
    attachmentField,
    error,
    actions,
  );

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    const stopLoading = startLoading(isNew ? "Création de la fiche..." : "Enregistrement de la fiche...");
    const stopSubmitLoading = setFormLoading(form, isNew ? "Création..." : "Enregistrement...");
    const result = await readResourceForm(form, resource, { isNew });

    if (!result.ok) {
      error.hidden = false;
      error.textContent = result.message;
      stopSubmitLoading();
      stopLoading();
      return;
    }

    try {
      await saveResourceFromEditor(resource.id, result.resource, { isNew });
    } catch {
      editableResourceState = loadEditableResourceState();
      refreshResourceIndex();
      renderDisease();
      error.hidden = false;
      error.textContent = apiEnabled
        ? "La sauvegarde en ligne a échoué. Vérifiez la connexion puis réessayez."
        : "La sauvegarde locale a échoué. Essayez avec un fichier plus léger ou ajoutez un lien à la place.";
      return;
    } finally {
      stopSubmitLoading();
      stopLoading();
    }

    closeAdminDialog();
  });

  return form;
}

function createQuestionnaireEditor(questionnaire) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "admin-fieldset questionnaire-editor";

  const legend = document.createElement("legend");
  legend.textContent = "Questions";

  const help = document.createElement("p");
  help.className = "admin-help";
  help.textContent =
    "Le questionnaire public ne demandera ni nom ni coordonnées. Évitez toute question permettant d'identifier une personne.";

  const list = document.createElement("div");
  list.className = "question-editor-list";
  normalizeQuestionnaireDefinition(questionnaire).questions.forEach((question) => {
    list.append(createQuestionEditorItem(question));
  });

  const addButton = document.createElement("button");
  addButton.className = "admin-button questionnaire-add-question";
  addButton.type = "button";
  addButton.textContent = "Ajouter une question";
  addButton.addEventListener("click", () => {
    const item = createQuestionEditorItem({
      id: createCommentId(),
      prompt: "Nouvelle question",
      type: "short",
      options: [],
      required: false,
    });
    list.append(item);
    item.querySelector('[data-question-field="prompt"]')?.focus();
  });

  fieldset.append(legend, help, list, addButton);
  return fieldset;
}

function createQuestionEditorItem(question) {
  const normalized = normalizeQuestionnaireQuestion(question, 0);
  const item = document.createElement("article");
  item.className = "question-editor-item";
  item.dataset.questionId = normalized.id;

  const promptField = createFieldLabel("Question", "input", {
    type: "text",
    value: normalized.prompt,
    maxlength: "500",
    "data-question-field": "prompt",
  });

  const typeField = createSelectLabel(
    "Type de réponse",
    "",
    [
      { value: "short", label: "Réponse courte" },
      { value: "long", label: "Réponse longue" },
      { value: "single", label: "Choix unique" },
      { value: "scale", label: "Échelle de 1 à 5" },
    ],
    normalized.type,
  );
  const typeSelect = typeField.querySelector("select");
  typeSelect.removeAttribute("name");
  typeSelect.dataset.questionField = "type";

  const optionsField = createFieldLabel("Choix proposés, un par ligne", "textarea", {
    rows: "4",
    "data-question-field": "options",
    placeholder: "Premier choix\nDeuxième choix",
  });
  optionsField.classList.add("question-options-field");
  optionsField.querySelector("textarea").value = normalized.options.join("\n");

  const requiredLabel = document.createElement("label");
  requiredLabel.className = "admin-checkbox";
  const requiredInput = document.createElement("input");
  requiredInput.type = "checkbox";
  requiredInput.checked = normalized.required;
  requiredInput.dataset.questionField = "required";
  const requiredText = document.createElement("span");
  requiredText.textContent = "Réponse obligatoire";
  requiredLabel.append(requiredInput, requiredText);

  const remove = document.createElement("button");
  remove.className = "admin-button question-remove-button";
  remove.type = "button";
  remove.textContent = "Supprimer cette question";
  remove.addEventListener("click", () => item.remove());

  const updateOptionsVisibility = () => {
    optionsField.hidden = typeSelect.value !== "single";
  };
  typeSelect.addEventListener("change", updateOptionsVisibility);
  updateOptionsVisibility();

  item.append(promptField, typeField, optionsField, requiredLabel, remove);
  return item;
}

function createThemeFields(selectedTheme) {
  const wrapper = document.createElement("div");
  wrapper.className = "theme-editor-fields";

  const themes = getAvailableResourceSections(selectedTheme);
  const themeField = createSelectLabel(
    "Thème",
    "section",
    [
      ...themes.map((theme) => ({ value: theme, label: theme })),
      { value: newThemeOptionValue, label: "Créer un nouveau thème..." },
    ],
    selectedTheme,
  );

  const newThemeField = createFieldLabel("Nom du nouveau thème", "input", {
    type: "text",
    name: "newSection",
    maxlength: "120",
    placeholder: "Ex. Communication avec les aidants",
  });
  newThemeField.classList.add("new-theme-field");

  const select = themeField.querySelector("select");
  const input = newThemeField.querySelector("input");
  const updateNewThemeField = () => {
    const createsTheme = select.value === newThemeOptionValue;
    newThemeField.hidden = !createsTheme;
    input.required = createsTheme;
    if (createsTheme) {
      window.requestAnimationFrame(() => input.focus());
    }
  };

  select.addEventListener("change", updateNewThemeField);
  updateNewThemeField();
  wrapper.append(themeField, newThemeField);
  return wrapper;
}

function getAvailableResourceSections(currentTheme = "") {
  const themes = new Set(resourceSections);
  resources.forEach((resource) => {
    if (resource.section) {
      themes.add(resource.section);
    }
  });
  if (currentTheme) {
    themes.add(currentTheme);
  }
  return [...themes].sort(compareResourceThemes);
}

function createVisibilityFields(resource) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "admin-fieldset visibility-fieldset";

  const legend = document.createElement("legend");
  legend.textContent = "Visibilité";

  const label = document.createElement("label");
  label.className = "admin-checkbox";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = "hidden";
  input.checked = Boolean(resource.isHidden);

  const span = document.createElement("span");
  span.textContent = "Masquer cette fiche aux visiteurs non connectés";

  const help = document.createElement("p");
  help.className = "admin-help";
  help.textContent = "Quand elle est masquée, la fiche reste visible en gris uniquement après connexion.";

  label.append(input, span);
  fieldset.append(legend, label, help);
  return fieldset;
}

function createSelectLabel(labelText, name, options, selectedValue) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;

  const select = document.createElement("select");
  select.name = name;
  select.required = true;

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    item.selected = option.value === selectedValue;
    select.append(item);
  });

  label.append(span, select);
  return label;
}

function createDiseaseCheckboxes(selectedDiseaseIds) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "admin-fieldset";

  const legend = document.createElement("legend");
  legend.textContent = "Afficher dans";
  fieldset.append(legend);

  diseases.forEach((disease) => {
    const label = document.createElement("label");
    label.className = "admin-checkbox";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "diseaseIds";
    input.value = disease.id;
    input.checked = selectedDiseaseIds.includes(disease.id);

    const span = document.createElement("span");
    span.textContent = disease.label;

    label.append(input, span);
    fieldset.append(label);
  });

  return fieldset;
}

function createAttachmentFields(resource, options = {}) {
  const { isNew = false } = options;
  const fieldset = document.createElement("fieldset");
  fieldset.className = "admin-fieldset attachment-fieldset";

  const legend = document.createElement("legend");
  legend.textContent = "Ressource liée";
  fieldset.append(legend);

  const modeLabel = createSelectLabel(
    "Action",
    "attachmentMode",
    [
      ...(isNew ? [] : [{ value: "preserve", label: "Conserver la ressource actuelle" }]),
      { value: "replace-link", label: "Ajouter ou remplacer par un lien" },
      { value: "replace-file", label: "Ajouter ou remplacer par un fichier" },
      { value: "none", label: "Aucune ressource liée" },
    ],
    isNew ? "none" : "preserve",
  );

  const urlLabel = createFieldLabel("Lien", "input", {
    type: "url",
    name: "attachmentUrl",
    placeholder: "https://...",
  });
  urlLabel.classList.add("attachment-link-field");

  const fileLabel = createFieldLabel("Fichier", "input", {
    type: "file",
    name: "attachmentFile",
    accept: "image/*,application/pdf,video/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt",
  });
  fileLabel.classList.add("attachment-file-field");

  const current = document.createElement("p");
  current.className = "admin-help";
  current.textContent = resource.attachment
    ? `Ressource actuelle : ${getAttachmentDisplayName(resource.attachment)}`
    : "Aucune ressource actuelle.";

  const help = document.createElement("p");
  help.className = "admin-help";
  help.textContent = apiEnabled
    ? "Les images, PDF, vidéos et documents importés sont sauvegardés dans la base du site. Taille maximale : 3 Mo."
    : "Les images, PDF, vidéos et documents importés sont sauvegardés dans ce navigateur pour la maquette. Taille maximale : 3 Mo.";

  const modeSelect = modeLabel.querySelector("select");
  const updateAttachmentInputs = () => {
    const mode = modeSelect.value;
    urlLabel.hidden = mode !== "replace-link";
    fileLabel.hidden = mode !== "replace-file";
    help.hidden = mode !== "replace-file";
  };

  modeSelect.addEventListener("change", updateAttachmentInputs);
  updateAttachmentInputs();

  fieldset.append(modeLabel, urlLabel, fileLabel, current, help);
  return fieldset;
}

function createIllustrationFields(resource, options = {}) {
  const { isNew = false } = options;
  const fieldset = document.createElement("fieldset");
  fieldset.className = "admin-fieldset illustration-fieldset";

  const legend = document.createElement("legend");
  legend.textContent = "Image d'illustration";
  fieldset.append(legend);

  const modeLabel = createSelectLabel(
    "Action",
    "illustrationMode",
    [
      ...(isNew ? [] : [{ value: "preserve", label: "Conserver l'image actuelle" }]),
      { value: "replace-link", label: "Ajouter ou remplacer par un lien image" },
      { value: "replace-file", label: "Ajouter ou remplacer par une image" },
      { value: "none", label: "Aucune image personnalisée" },
    ],
    isNew ? "none" : "preserve",
  );

  const urlLabel = createFieldLabel("Lien de l'image", "input", {
    type: "url",
    name: "illustrationUrl",
    placeholder: "https://...",
  });
  urlLabel.classList.add("illustration-link-field");

  const fileLabel = createFieldLabel("Image", "input", {
    type: "file",
    name: "illustrationFile",
    accept: "image/*",
  });
  fileLabel.classList.add("illustration-file-field");

  const current = document.createElement("p");
  current.className = "admin-help";
  current.textContent = resource.illustration
    ? `Image actuelle : ${getAttachmentDisplayName(resource.illustration)}`
    : "Aucune image d'illustration personnalisée.";

  const help = document.createElement("p");
  help.className = "admin-help";
  help.textContent =
    "Cette image sert seulement à illustrer la carte. Elle ne remplace pas la ressource liée. Taille maximale : 3 Mo.";

  const modeSelect = modeLabel.querySelector("select");
  const updateIllustrationInputs = () => {
    const mode = modeSelect.value;
    urlLabel.hidden = mode !== "replace-link";
    fileLabel.hidden = mode !== "replace-file";
    help.hidden = mode !== "replace-file";
  };

  modeSelect.addEventListener("change", updateIllustrationInputs);
  updateIllustrationInputs();

  fieldset.append(modeLabel, urlLabel, fileLabel, current, help);
  return fieldset;
}

function createAdminFormActions(primaryText, options = {}) {
  const { onDelete = null } = options;
  const actions = document.createElement("div");
  actions.className = "admin-form-actions";

  if (onDelete) {
    const remove = document.createElement("button");
    remove.className = "admin-button admin-danger-button";
    remove.type = "button";
    remove.textContent = "Supprimer la fiche";
    remove.addEventListener("click", onDelete);
    actions.append(remove);
  }

  const cancel = document.createElement("button");
  cancel.className = "admin-button";
  cancel.type = "button";
  cancel.textContent = "Annuler";
  cancel.addEventListener("click", closeAdminDialog);

  const submit = document.createElement("button");
  submit.className = "admin-button admin-button-primary";
  submit.type = "submit";
  submit.textContent = primaryText;

  actions.append(cancel, submit);
  return actions;
}

async function readResourceForm(form, originalResource, options = {}) {
  const { isNew = false } = options;
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const format = String(formData.get("format") ?? "standard") === "questionnaire"
    ? "questionnaire"
    : "standard";
  const selectedSection = String(formData.get("section") ?? "").trim();
  const requestedNewSection = String(formData.get("newSection") ?? "").trim();
  const section = selectedSection === newThemeOptionValue
    ? getCanonicalThemeName(requestedNewSection)
    : selectedSection;
  const diseaseIds = formData.getAll("diseaseIds").map(String);
  const attachmentMode = String(formData.get("attachmentMode") ?? "none");
  const attachmentUrl = String(formData.get("attachmentUrl") ?? "").trim();
  const attachmentFile = formData.get("attachmentFile");
  const illustrationMode = String(formData.get("illustrationMode") ?? "none");
  const illustrationUrl = String(formData.get("illustrationUrl") ?? "").trim();
  const illustrationFile = formData.get("illustrationFile");
  const isHidden = formData.get("hidden") === "on";

  if (!title) {
    return { ok: false, message: "Le titre est obligatoire." };
  }

  if (!section) {
    return { ok: false, message: "Le thème est obligatoire." };
  }

  if (diseaseIds.length === 0) {
    return { ok: false, message: "Sélectionnez au moins une pathologie." };
  }

  const questionnaireResult = readQuestionnaireEditor(form, format);
  if (!questionnaireResult.ok) {
    return questionnaireResult;
  }

  if (attachmentMode === "replace-link" && !attachmentUrl) {
    return { ok: false, message: "Ajoutez un lien ou choisissez une autre action pour la ressource liée." };
  }

  if (attachmentMode === "replace-file") {
    if (!(attachmentFile instanceof File) || !attachmentFile.name) {
      return { ok: false, message: "Choisissez un fichier ou sélectionnez une autre action." };
    }

    if (attachmentFile.size > maxLocalAttachmentBytes) {
      return { ok: false, message: "Ce fichier est trop lourd pour la maquette locale. Taille maximale : 3 Mo." };
    }
  }

  if (illustrationMode === "replace-link" && !illustrationUrl) {
    return { ok: false, message: "Ajoutez un lien image ou choisissez une autre action pour l'illustration." };
  }

  if (illustrationMode === "replace-file") {
    if (!(illustrationFile instanceof File) || !illustrationFile.name) {
      return { ok: false, message: "Choisissez une image ou sélectionnez une autre action pour l'illustration." };
    }

    if (!isImageFile(illustrationFile)) {
      return { ok: false, message: "L'illustration doit être une image." };
    }

    if (illustrationFile.size > maxLocalAttachmentBytes) {
      return { ok: false, message: "Cette image est trop lourde pour la maquette locale. Taille maximale : 3 Mo." };
    }
  }

  let attachment = null;
  let illustration = null;
  try {
    attachment = await buildEditedAttachment(
      originalResource,
      attachmentMode,
      attachmentUrl,
      attachmentFile,
      title,
    );
    illustration = await buildEditedIllustration(
      originalResource,
      illustrationMode,
      illustrationUrl,
      illustrationFile,
      title,
    );
  } catch {
    return { ok: false, message: "Le fichier n'a pas pu être lu. Essayez un autre fichier ou ajoutez un lien." };
  }

  return {
    ok: true,
    resource: normalizeEditableResource({
      ...originalResource,
      id: isNew ? createLocalResourceId() : originalResource.id,
      postNumber: isNew ? Date.now() : originalResource.postNumber,
      title,
      section,
      category: getCategoryForSection(section),
      tagClass: getTagClassForSection(section),
      summary: String(formData.get("summary") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      diseaseIds,
      illustration,
      attachment,
      updatedAt: new Date().toISOString(),
      importedComments: originalResource.importedComments ?? [],
      isHidden,
      format,
      questionnaire: questionnaireResult.questionnaire,
    }),
  };
}

function readQuestionnaireEditor(form, format) {
  if (format !== "questionnaire") {
    return { ok: true, questionnaire: { questions: [] } };
  }

  const items = [...form.querySelectorAll(".question-editor-item")];
  if (items.length === 0) {
    return { ok: false, message: "Ajoutez au moins une question au questionnaire." };
  }

  const questions = [];
  for (const [index, item] of items.entries()) {
    const prompt = item.querySelector('[data-question-field="prompt"]')?.value.trim() || "";
    const type = item.querySelector('[data-question-field="type"]')?.value || "short";
    const options = (item.querySelector('[data-question-field="options"]')?.value || "")
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!prompt) {
      return { ok: false, message: `Renseignez le texte de la question ${index + 1}.` };
    }

    if (type === "single" && options.length < 2) {
      return {
        ok: false,
        message: `Ajoutez au moins deux choix à la question ${index + 1}.`,
      };
    }

    questions.push({
      id: item.dataset.questionId || createCommentId(),
      prompt,
      type,
      options: type === "single" ? options : [],
      required: Boolean(item.querySelector('[data-question-field="required"]')?.checked),
    });
  }

  return { ok: true, questionnaire: { questions } };
}

function getCanonicalThemeName(themeName) {
  const normalizedName = normalizeText(themeName);
  const existingTheme = getAvailableResourceSections().find(
    (theme) => normalizeText(theme) === normalizedName,
  );
  return existingTheme || themeName;
}

async function buildEditedAttachment(originalResource, mode, url, file, title) {
  if (mode === "preserve") {
    return originalResource.attachment ?? null;
  }

  if (mode === "none") {
    return null;
  }

  if (mode === "replace-file" && file instanceof File && file.name) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      label: file.name,
      url: dataUrl,
      kind: getFileKind(file),
      local: true,
      storage: "browser",
      size: file.size,
    };
  }

  return {
    label: title,
    url,
    kind: getAttachmentKindFromUrl(url),
    local: false,
  };
}

async function buildEditedIllustration(originalResource, mode, url, file, title) {
  if (mode === "preserve") {
    return originalResource.illustration ?? null;
  }

  if (mode === "none") {
    return null;
  }

  if (mode === "replace-file" && file instanceof File && file.name) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      label: file.name,
      url: dataUrl,
      kind: getFileKind(file),
      local: true,
      storage: "browser",
      size: file.size,
    };
  }

  const kind = getAttachmentKindFromUrl(url);
  return {
    label: title,
    url,
    kind: kind.startsWith("image/") ? kind : "image/*",
    local: false,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Lecture impossible")));
    reader.readAsDataURL(file);
  });
}

function getFileKind(file) {
  return file.type || getMimeTypeFromName(file.name) || "application/octet-stream";
}

function isImageFile(file) {
  return getFileKind(file).startsWith("image/");
}

function getAttachmentKindFromUrl(url) {
  try {
    const parsed = new URL(url);
    return getMimeTypeFromName(parsed.pathname) || "text/html";
  } catch {
    return "text/html";
  }
}

function getMimeTypeFromName(name) {
  const cleanName = String(name ?? "").toLowerCase().split("?")[0].split("#")[0];

  if (cleanName.endsWith(".png")) return "image/png";
  if (cleanName.endsWith(".jpg") || cleanName.endsWith(".jpeg")) return "image/jpeg";
  if (cleanName.endsWith(".webp")) return "image/webp";
  if (cleanName.endsWith(".gif")) return "image/gif";
  if (cleanName.endsWith(".svg")) return "image/svg+xml";
  if (cleanName.endsWith(".pdf")) return "application/pdf";
  if (cleanName.endsWith(".mp4")) return "video/mp4";
  if (cleanName.endsWith(".webm")) return "video/webm";
  if (cleanName.endsWith(".mov")) return "video/quicktime";
  if (cleanName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (cleanName.endsWith(".doc")) return "application/msword";
  if (cleanName.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (cleanName.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (cleanName.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (cleanName.endsWith(".xls")) return "application/vnd.ms-excel";
  if (cleanName.endsWith(".txt")) return "text/plain";
  return "";
}

function getAttachmentDisplayName(attachment) {
  if (attachment.storage === "browser") {
    return attachment.label || "fichier importé";
  }

  return attachment.url || attachment.label || "ressource liée";
}

async function saveResourceFromEditor(originalId, editedResource, options = {}) {
  const { isNew = false } = options;
  const shouldHide = Boolean(editedResource.isHidden);
  const previousState = cloneJson(editableResourceState);

  if (isNew) {
    editableResourceState.created.push(editedResource);
  } else if (baseResources.some((resource) => resource.id === originalId)) {
    editableResourceState.overrides[originalId] = extractEditableResourceFields(editedResource);
  } else {
    editableResourceState.created = editableResourceState.created.map((resource) =>
      resource.id === originalId ? editedResource : resource,
    );
  }

  setResourceHidden(editedResource.id, shouldHide);

  if (apiEnabled) {
    try {
      await apiRequest("/api/resource-state", {
        method: "PUT",
        auth: true,
        body: { resourceState: editableResourceState },
      });
      await loadBackendState({ silent: true });
    } catch (error) {
      editableResourceState = previousState;
      throw error;
    }
  } else {
    saveEditableResourceState();
  }

  refreshResourceIndex();
  renderDisease();
}

function setResourceHidden(resourceId, shouldHide) {
  const hiddenIds = new Set(editableResourceState.hidden);

  if (shouldHide) {
    hiddenIds.add(resourceId);
  } else {
    hiddenIds.delete(resourceId);
  }

  editableResourceState.hidden = [...hiddenIds];
}

async function requestDeleteResource(resourceId, control = null) {
  const resource = resourcesById[resourceId];

  if (!resource) {
    return;
  }

  const confirmed = window.confirm(
    `Êtes-vous bien sûr de vouloir supprimer cette fiche ?\n\n${resource.title}`,
  );

  if (!confirmed) {
    return;
  }

  const stopLoading = startLoading("Suppression de la fiche...");
  const stopControlLoading = setControlLoading(control, "Suppression...");

  try {
    await deleteResource(resourceId);
    closeAdminDialog({ restoreFocus: false });
  } finally {
    stopControlLoading();
    stopLoading();
  }
}

async function deleteResource(resourceId) {
  const isBaseResource = baseResources.some((resource) => resource.id === resourceId);
  const previousState = cloneJson(editableResourceState);

  if (isBaseResource) {
    editableResourceState.deleted = [...new Set([...editableResourceState.deleted, resourceId])];
    delete editableResourceState.overrides[resourceId];
  } else {
    editableResourceState.created = editableResourceState.created.filter(
      (resource) => resource.id !== resourceId,
    );
    editableResourceState.deleted = editableResourceState.deleted.filter((id) => id !== resourceId);
  }

  editableResourceState.hidden = editableResourceState.hidden.filter((id) => id !== resourceId);

  if (apiEnabled) {
    try {
      await apiRequest("/api/resource-state", {
        method: "PUT",
        auth: true,
        body: { resourceState: editableResourceState },
      });
      await apiRequest(`/api/comments/${encodeURIComponent(resourceId)}`, {
        method: "PUT",
        auth: true,
        body: { comments: [] },
      });
      await apiRequest(`/api/questionnaires/${encodeURIComponent(resourceId)}/responses`, {
        method: "DELETE",
        auth: true,
      }).catch(() => null);
      await loadBackendState({ silent: true });
    } catch (error) {
      editableResourceState = previousState;
      throw error;
    }
  } else {
    localStorage.removeItem(getStorageKey(resourceId));
    delete questionnaireResponseState[resourceId];
    saveQuestionnaireResponseStateLocally();
    saveEditableResourceState();
  }

  refreshResourceIndex();
  renderAdminControls();

  if (activeModal?.dataset.resourceId === resourceId) {
    closeResourceModal({ restoreFocus: false });
  }

  renderDisease();
}

function extractEditableResourceFields(resource) {
  return {
    title: resource.title,
    section: resource.section,
    category: resource.category,
    tagClass: resource.tagClass,
    summary: resource.summary,
    body: resource.body,
    diseaseIds: resource.diseaseIds,
    illustration: resource.illustration,
    attachment: resource.attachment,
    updatedAt: resource.updatedAt,
    format: resource.format,
    questionnaire: resource.questionnaire,
  };
}

function createLocalResourceId() {
  return `local-${createCommentId()}`;
}

function openAdminDialog(titleText, contentNode) {
  closeAdminDialog({ restoreFocus: false });
  adminPreviousFocus = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "admin-dialog-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "adminDialogTitle");

  const dialog = document.createElement("section");
  dialog.className = "admin-dialog";

  const header = document.createElement("header");
  header.className = "admin-dialog-header";

  const title = document.createElement("h2");
  title.id = "adminDialogTitle";
  title.textContent = titleText;

  const close = document.createElement("button");
  close.className = "admin-dialog-close";
  close.type = "button";
  close.setAttribute("aria-label", "Fermer");
  close.textContent = "×";
  close.addEventListener("click", closeAdminDialog);

  header.append(title, close);
  dialog.append(header, contentNode);
  overlay.append(dialog);
  document.body.append(overlay);
  activeAdminDialog = overlay;

  const firstField =
    contentNode.querySelector("input, textarea, select, button") ??
    overlay.querySelector("input, textarea, select, button");
  if (firstField instanceof HTMLElement) {
    firstField.focus();
  }
}

function closeAdminDialog(options = {}) {
  const { restoreFocus = true } = options;

  if (!activeAdminDialog) {
    return;
  }

  activeAdminDialog.remove();
  activeAdminDialog = null;

  if (restoreFocus && adminPreviousFocus instanceof HTMLElement) {
    adminPreviousFocus.focus();
  }

  adminPreviousFocus = null;
}

function createResourceCard(resource) {
  const commentCount = getApprovedCommentCount(resource.id);
  const pendingCommentCount = getPendingCommentCount(resource.id);
  const card = document.createElement("article");
  card.className = "resource-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute(
    "aria-label",
    `${resource.format === "questionnaire" ? "Répondre à" : "Ouvrir"} ${resource.title}, ${formatCommentCount(commentCount)}${
      isAdminLoggedIn && pendingCommentCount > 0 ? `, ${formatPendingCommentCount(pendingCommentCount)}` : ""
    }${resource.isHidden ? ", fiche masquée" : ""}`,
  );
  const youtubeThumbnailUrl = resource.attachment ? getYouTubeThumbnailUrl(resource.attachment.url) : "";
  const illustrationPreviewUrl = resource.illustration?.url ?? "";
  const hasCustomIllustration = Boolean(illustrationPreviewUrl);
  const hasImagePreview = resource.attachment && isImageResource(resource.attachment);
  const hasThumbnailPreview = Boolean(youtubeThumbnailUrl);
  const generatedPreviewUrl = hasCustomIllustration || hasImagePreview || hasThumbnailPreview ? "" : getGeneratedPreviewUrl(resource);
  card.classList.add("has-visual");

  card.classList.add("has-preview");

  if (resource.isHidden) {
    card.classList.add("is-hidden-resource");
  }

  if (generatedPreviewUrl) {
    card.classList.add("has-generated-preview");
  }

  if (hasCustomIllustration) {
    card.classList.add("has-illustration");
  }

  const main = document.createElement("div");
  main.className = "resource-main";

  const content = document.createElement("div");
  content.className = "resource-card-content";

  const topline = document.createElement("div");
  topline.className = "resource-topline";

  const title = document.createElement("h3");
  title.textContent = resource.title;

  const tag = document.createElement("span");
  tag.className = `tag ${resource.tagClass}`;
  tag.textContent = resource.section;

  topline.append(title, tag);

  if (resource.format === "questionnaire") {
    const formatBadge = document.createElement("span");
    formatBadge.className = "questionnaire-format-badge";
    formatBadge.textContent = "Questionnaire anonyme";
    topline.append(formatBadge);
  }

  if (resource.isHidden && isAdminLoggedIn) {
    const hiddenBadge = document.createElement("span");
    hiddenBadge.className = "hidden-resource-badge";
    hiddenBadge.textContent = "Masquée";
    topline.append(hiddenBadge);
  }

  content.append(topline);

  let media;
  if (hasCustomIllustration) {
    media = createMediaPreview(resource, illustrationPreviewUrl);
  } else if (hasImagePreview) {
    media = createMediaPreview(resource);
  } else if (hasThumbnailPreview) {
    media = createMediaPreview(resource, youtubeThumbnailUrl);
  } else {
    media = createMediaPreview(resource, generatedPreviewUrl);
  }

  if (resource.summary) {
    const summary = document.createElement("p");
    summary.className = "resource-summary";
    summary.textContent = resource.summary;
    content.append(summary);
  }

  const hint = document.createElement("p");
  hint.className = "card-open-hint";
  hint.textContent = resource.format === "questionnaire" ? "Répondre au questionnaire" : "Ouvrir la fiche";

  const commentBadge = document.createElement("p");
  commentBadge.className = "card-comment-count";
  commentBadge.textContent = formatCommentCount(commentCount);

  const footer = document.createElement("div");
  footer.className = "resource-footer";
  footer.append(hint, commentBadge);

  if (isAdminLoggedIn && pendingCommentCount > 0) {
    const pendingBadge = document.createElement("p");
    pendingBadge.className = "card-pending-count";
    pendingBadge.textContent = formatPendingCommentCount(pendingCommentCount);
    footer.append(pendingBadge);
  }

  if (isAdminLoggedIn) {
    const editButton = document.createElement("button");
    editButton.className = "card-edit-button";
    editButton.type = "button";
    editButton.textContent = "Modifier";
    editButton.setAttribute("aria-label", `Modifier ${resource.title}`);
    editButton.addEventListener("click", (event) => {
      event.stopPropagation();
      openResourceEditor(resource.id);
    });
    footer.append(editButton);
  }

  content.append(footer);

  main.append(media, content);
  card.append(main);
  card.addEventListener("click", () => openResourceModal(resource.id));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openResourceModal(resource.id);
    }
  });

  return card;
}

function formatCommentCount(count) {
  return `${count} ${count > 1 ? "commentaires" : "commentaire"}`;
}

function formatResourceCount(count) {
  return `${count} ${count > 1 ? "fiches" : "fiche"}`;
}

function formatPendingCommentCount(count) {
  return `${count} ${count > 1 ? "commentaires à valider" : "commentaire à valider"}`;
}

function createMediaPreview(resource, sourceUrl = resource.illustration?.url ?? resource.attachment?.url ?? "") {
  const media = document.createElement("div");
  media.className = "resource-media";

  const image = document.createElement("img");
  image.src = sourceUrl;
  image.alt = "";
  image.loading = "lazy";

  media.append(image);
  return media;
}

function getGeneratedPreviewUrl(resource) {
  const directPreview = generatedPreviewByResourceId[resource.id];

  if (directPreview) {
    return `${generatedPreviewBasePath}${directPreview}`;
  }

  const kind = getIllustrationConfig(resource).kind;
  return `${generatedPreviewBasePath}${generatedPreviewByKind[kind] ?? "workbooks.jpg"}`;
}

function getIllustrationConfig(resource) {
  const text = normalizeText(`${resource.title} ${resource.section}`);
  const make = (kind) => ({ kind });

  if (text.includes("executive")) return make("checklist");
  if (text.includes("visuo") || text.includes("perception")) return make("eyeGrid");
  if (text.includes("attention")) return make("target");
  if (text.includes("memoire")) return make("memory");
  if (text.includes("langage") || text.includes("mot")) return make("speech");
  if (text.includes("jeu")) return make("games");
  if (text.includes("livret") || text.includes("carnet") || text.includes("cahier")) return make("book");
  if (text.includes("application") || text.includes("numerique")) return make("tablet");
  if (text.includes("hygiene") || text.includes("bucco")) return make("tooth");
  if (text.includes("posture") || text.includes("environnement")) return make("posture");
  if (text.includes("reeducative") || text.includes("souffle")) return make("breath");
  if (text.includes("olfaction")) return make("smell");
  if (text.includes("relaxation")) return make("relax");
  if (text.includes("deglutition") || text.includes("swallow")) return make("swallow");
  if (text.includes("plateforme") || text.includes("accompagnement")) return make("support");
  if (text.includes("recette") || text.includes("texture")) return make("bowl");
  if (text.includes("plaisir")) return make("heart");
  if (text.includes("partage") || text.includes("experience")) return make("story");

  return make("book");
}

function getIllustrationPalette(tagClass, postNumber) {
  const palettes = {
    cognition: { bg: "#f2eefb", soft: "#ddd4f3", accent: "#6651a0", ink: "#293044" },
    huntington: { bg: "#f7edf5", soft: "#ead3e7", accent: "#7f4a7a", ink: "#30243a" },
    quotidien: { bg: "#edf4f8", soft: "#d4e5ee", accent: "#486b85", ink: "#213343" },
    deglutition: { bg: "#faedf0", soft: "#f1d4da", accent: "#a64b5f", ink: "#3a2730" },
    aidants: { bg: "#f1f5ea", soft: "#dce8ca", accent: "#607d3b", ink: "#283420" },
    experience: { bg: "#f5f1e6", soft: "#e4dcc4", accent: "#6d6548", ink: "#332f23" },
  };
  const palette = palettes[tagClass] ?? palettes.quotidien;
  const alternates = ["#08746f", "#a64b5f", "#6651a0", "#607d3b", "#486b85"];

  return {
    ...palette,
    secondary: alternates[postNumber % alternates.length],
  };
}

function drawAccessibleIllustration(svg, config, palette) {
  addSvgNode(svg, "rect", { width: 320, height: 190, rx: 18, fill: palette.bg });
  addSvgNode(svg, "rect", { x: 0, y: 128, width: 320, height: 62, fill: palette.soft, opacity: 0.72 });
  addSvgNode(svg, "circle", { cx: 282, cy: 32, r: 22, fill: "#fff", opacity: 0.42 });
  drawAccessibleScene(svg, config.kind, palette);
}

function drawAccessibleScene(svg, kind, palette) {
  if (kind === "checklist") {
    drawTable(svg, 126, palette);
    drawSeatedPerson(svg, 82, 129, palette);
    drawClipboard(svg, 178, 36, 76, 88, palette);
    drawCalendarCard(svg, 254, 50, palette);
    return;
  }

  if (kind === "eyeGrid") {
    drawSeatedPerson(svg, 74, 130, palette);
    drawMapCard(svg, 145, 35, 126, 92, palette);
    addSvgNode(svg, "path", { d: "M260 51c15-16 39-16 54 0-15 16-39 16-54 0z", fill: "#fff", stroke: palette.ink, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "circle", { cx: 287, cy: 51, r: 9, fill: palette.accent });
    return;
  }

  if (kind === "target") {
    drawTable(svg, 130, palette);
    drawSeatedPerson(svg, 93, 132, palette);
    addSvgNode(svg, "rect", { x: 145, y: 50, width: 88, height: 62, rx: 9, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "circle", { cx: 189, cy: 81, r: 22, fill: "none", stroke: palette.secondary, "stroke-width": 6 });
    addSvgNode(svg, "circle", { cx: 189, cy: 81, r: 8, fill: palette.accent });
    addSvgNode(svg, "rect", { x: 247, y: 54, width: 34, height: 54, rx: 6, fill: "#fff", stroke: palette.ink, "stroke-width": 4 });
    addSvgNode(svg, "path", { d: "M244 52l41 59M285 52l-41 59", ...lineAttrs("#b33a4a", 5) });
    return;
  }

  if (kind === "memory") {
    drawTable(svg, 130, palette);
    drawSeatedPerson(svg, 74, 132, palette);
    drawMemoryCards(svg, 145, 47, palette);
    addSvgNode(svg, "rect", { x: 236, y: 52, width: 52, height: 66, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "circle", { cx: 262, cy: 74, r: 14, fill: palette.soft, stroke: palette.ink, "stroke-width": 3 });
    addSvgNode(svg, "path", { d: "M244 103h36", ...lineAttrs(palette.secondary, 5) });
    return;
  }

  if (kind === "speech") {
    drawPersonBust(svg, 70, 121, palette, "left");
    drawPersonBust(svg, 246, 121, palette, "right");
    drawSpeechBubble(svg, 111, 34, 94, 51, palette);
    drawSpeechBubble(svg, 178, 75, 76, 44, palette);
    return;
  }

  if (kind === "games") {
    drawTable(svg, 131, palette);
    addSvgNode(svg, "rect", { x: 91, y: 47, width: 138, height: 82, rx: 12, fill: "#fff", stroke: palette.accent, "stroke-width": 6 });
    [121, 151, 181].forEach((x) => addSvgNode(svg, "path", { d: `M${x} 55v66`, ...lineAttrs(palette.soft, 4) }));
    [75, 102].forEach((y) => addSvgNode(svg, "path", { d: `M100 ${y}h120`, ...lineAttrs(palette.soft, 4) }));
    addSvgNode(svg, "circle", { cx: 121, cy: 74, r: 10, fill: palette.secondary });
    addSvgNode(svg, "circle", { cx: 181, cy: 102, r: 10, fill: palette.accent });
    drawDice(svg, 48, 79, palette);
    drawPlayingCards(svg, 239, 67, palette);
    drawHand(svg, 72, 143, palette, "left");
    drawHand(svg, 248, 143, palette, "right");
    return;
  }

  if (kind === "book") {
    drawTable(svg, 132, palette);
    drawPersonBust(svg, 76, 126, palette, "front");
    drawOpenBook(svg, 139, 58, 122, 72, palette);
    addSvgNode(svg, "path", { d: "M253 124l24-37 10 7-24 37-14 5z", fill: "#fff", stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
    return;
  }

  if (kind === "tablet") {
    drawTable(svg, 132, palette);
    drawPersonBust(svg, 72, 126, palette, "front");
    addSvgNode(svg, "rect", { x: 136, y: 35, width: 126, height: 92, rx: 14, fill: "#fff", stroke: palette.accent, "stroke-width": 6 });
    [166, 199, 232].forEach((x) => [66, 98].forEach((y, index) => addSvgNode(svg, "rect", { x: x - 12, y: y - 12, width: 24, height: 24, rx: 6, fill: index === 0 ? palette.secondary : palette.soft, stroke: palette.ink, "stroke-width": 2 })));
    drawHand(svg, 238, 144, palette, "right");
    return;
  }

  if (kind === "swallow") {
    drawProfileHead(svg, 92, 84, palette);
    addSvgNode(svg, "path", { d: "M120 84c27 2 40 20 39 49", ...lineAttrs(palette.secondary, 7) });
    addSvgNode(svg, "path", { d: "M151 135c18 10 37 9 55-3", ...lineAttrs(palette.accent, 6) });
    addSvgNode(svg, "path", { d: "M195 50h45l-10 85h-25z", fill: "#fff", stroke: palette.accent, "stroke-width": 6, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M205 82h29", ...lineAttrs(palette.soft, 7) });
    addSvgNode(svg, "circle", { cx: 171, cy: 74, r: 9, fill: palette.secondary });
    addSvgNode(svg, "path", { d: "M176 78c13 8 20 19 21 32", ...lineAttrs(palette.secondary, 5) });
    return;
  }

  if (kind === "tooth") {
    addSvgNode(svg, "path", { d: "M96 42c-24 0-37 20-29 49l13 47c5 18 23 15 30-1l10-31 10 31c7 16 25 19 30 1l13-47c8-29-5-49-29-49-12 0-17 7-24 7s-12-7-24-7z", fill: "#fff", stroke: palette.accent, "stroke-width": 7, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M179 123l75-43", ...lineAttrs(palette.secondary, 11) });
    addSvgNode(svg, "rect", { x: 231, y: 60, width: 45, height: 19, rx: 8, fill: "#fff", stroke: palette.ink, "stroke-width": 5, transform: "rotate(-30 253 70)" });
    addSvgNode(svg, "path", { d: "M249 51l22 37", ...lineAttrs(palette.ink, 5) });
    return;
  }

  if (kind === "posture") {
    drawTable(svg, 118, palette);
    drawSeatedPerson(svg, 103, 136, palette);
    addSvgNode(svg, "rect", { x: 178, y: 74, width: 78, height: 11, rx: 5, fill: palette.ink });
    addSvgNode(svg, "circle", { cx: 218, cy: 68, r: 15, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M58 154h57M88 111v42M88 154h58", ...lineAttrs(palette.ink, 7) });
    addSvgNode(svg, "path", { d: "M52 169h80", ...lineAttrs(palette.accent, 5) });
    return;
  }

  if (kind === "breath") {
    drawPersonBust(svg, 83, 128, palette, "right");
    addSvgNode(svg, "path", { d: "M120 78c35-16 69-6 83 13M122 101c36-11 63-3 78 15M122 123c32-5 54 0 68 12", ...lineAttrs(palette.secondary, 7) });
    drawPinwheelLarge(svg, 242, 90, palette);
    return;
  }

  if (kind === "smell") {
    drawProfileHead(svg, 83, 82, palette);
    addSvgNode(svg, "path", { d: "M134 72c25-12 52-8 72 9M134 93c24-8 49-4 68 10", ...lineAttrs(palette.accent, 6) });
    addSvgNode(svg, "path", { d: "M218 133c-18 0-31-10-35-27h70c-4 17-17 27-35 27z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M198 92c-7-12 9-18 20-9 9-10 27-3 20 10-5 11-20 17-20 17s-15-7-20-18z", fill: palette.secondary });
    addSvgNode(svg, "path", { d: "M224 82c12-16 28-20 45-12", ...lineAttrs("#607d3b", 5) });
    return;
  }

  if (kind === "relax") {
    addSvgNode(svg, "rect", { x: 44, y: 113, width: 232, height: 16, rx: 8, fill: palette.accent });
    addSvgNode(svg, "path", { d: "M82 110c31-46 91-51 140-15", ...lineAttrs(palette.ink, 10) });
    addSvgNode(svg, "circle", { cx: 96, cy: 77, r: 18, fill: "#f4c7a3", stroke: palette.ink, "stroke-width": 4 });
    addSvgNode(svg, "path", { d: "M138 89c31-15 68-9 90 13M140 112c35-8 63-3 83 12", ...lineAttrs(palette.secondary, 6) });
    addSvgNode(svg, "path", { d: "M60 145h204", ...lineAttrs(palette.ink, 5) });
    return;
  }

  if (kind === "support") {
    drawPersonBust(svg, 70, 126, palette, "front");
    drawPersonBust(svg, 252, 126, palette, "front");
    addSvgNode(svg, "rect", { x: 122, y: 66, width: 78, height: 54, rx: 7, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M112 130h98", ...lineAttrs(palette.ink, 6) });
    drawSpeechBubble(svg, 125, 28, 94, 39, palette);
    return;
  }

  if (kind === "bowl") {
    drawTable(svg, 134, palette);
    addSvgNode(svg, "path", { d: "M72 82h128c-6 36-30 54-64 54S78 118 72 82z", fill: "#fff", stroke: palette.accent, "stroke-width": 7, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M100 69c11-11 29-11 40 0M151 69c11-11 29-11 40 0", ...lineAttrs(palette.secondary, 6) });
    addSvgNode(svg, "path", { d: "M222 45l-55 58", ...lineAttrs(palette.ink, 8) });
    addSvgNode(svg, "path", { d: "M239 69h34l-8 65h-18z", fill: "#fff", stroke: palette.secondary, "stroke-width": 5, "stroke-linejoin": "round" });
    return;
  }

  if (kind === "heart") {
    drawPersonBust(svg, 74, 125, palette, "front");
    drawOpenBook(svg, 131, 62, 102, 62, palette);
    addSvgNode(svg, "path", { d: "M252 133c-28-18-44-33-37-49 6-14 23-14 34-3 10-11 28-11 34 3 7 16-7 31-31 49z", fill: "#fff", stroke: palette.accent, "stroke-width": 6, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M235 104h13l7-11 8 23 7-12h16", ...lineAttrs(palette.secondary, 5) });
    return;
  }

  if (kind === "story") {
    drawTable(svg, 132, palette);
    drawPersonBust(svg, 76, 126, palette, "front");
    addSvgNode(svg, "rect", { x: 138, y: 46, width: 102, height: 78, rx: 9, fill: "#fff", stroke: palette.accent, "stroke-width": 6 });
    addSvgNode(svg, "path", { d: "M158 70h59M158 88h49M158 106h62", ...lineAttrs(palette.secondary, 6) });
    addSvgNode(svg, "path", { d: "M236 48h36a10 10 0 0 1 10 10v19a10 10 0 0 1-10 10h-16l-13 12 3-12h-10a10 10 0 0 1-10-10V58a10 10 0 0 1 10-10z", fill: "#fff", stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
    return;
  }

  drawAccessibleScene(svg, "book", palette);
}

function drawTable(svg, y, palette) {
  addSvgNode(svg, "rect", { x: 36, y, width: 248, height: 13, rx: 6, fill: palette.accent });
  addSvgNode(svg, "path", { d: `M68 ${y + 12}v39M252 ${y + 12}v39`, ...lineAttrs(palette.ink, 5) });
}

function drawPersonBust(svg, cx, baseY, palette, direction) {
  addSvgNode(svg, "path", { d: `M${cx - 35} ${baseY}c5-35 65-35 70 0z`, fill: "#fff", stroke: palette.accent, "stroke-width": 6, "stroke-linejoin": "round" });
  addSvgNode(svg, "circle", { cx, cy: baseY - 58, r: 23, fill: "#f4c7a3", stroke: palette.ink, "stroke-width": 5 });
  addSvgNode(svg, "path", { d: `M${cx - 19} ${baseY - 67}c12-17 33-9 40 6`, ...lineAttrs(palette.ink, 6) });
  const eyeX = direction === "left" ? cx - 7 : direction === "right" ? cx + 7 : cx;
  addSvgNode(svg, "path", { d: `M${eyeX - 8} ${baseY - 57}h16`, ...lineAttrs(palette.ink, 4) });
  addSvgNode(svg, "path", { d: `M${cx - 9} ${baseY - 45}c7 5 15 5 22 0`, ...lineAttrs(palette.secondary, 4) });
}

function drawSeatedPerson(svg, cx, baseY, palette) {
  addSvgNode(svg, "path", { d: `M${cx - 35} ${baseY + 5}h73v35h-12v-24h-49v24h-12z`, fill: "#fff", stroke: palette.ink, "stroke-width": 5, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx - 27} ${baseY - 2}c6-35 50-35 56 0z`, fill: "#fff", stroke: palette.accent, "stroke-width": 6, "stroke-linejoin": "round" });
  addSvgNode(svg, "circle", { cx, cy: baseY - 55, r: 21, fill: "#f4c7a3", stroke: palette.ink, "stroke-width": 5 });
  addSvgNode(svg, "path", { d: `M${cx - 18} ${baseY - 64}c13-16 30-8 38 4`, ...lineAttrs(palette.ink, 6) });
  addSvgNode(svg, "path", { d: `M${cx - 9} ${baseY - 45}c7 5 14 5 21 0`, ...lineAttrs(palette.secondary, 4) });
}

function drawProfileHead(svg, cx, cy, palette) {
  addSvgNode(svg, "circle", { cx, cy, r: 33, fill: "#f4c7a3", stroke: palette.ink, "stroke-width": 6 });
  addSvgNode(svg, "path", { d: `M${cx - 22} ${cy - 22}c18-18 46-4 48 21`, ...lineAttrs(palette.ink, 7) });
  addSvgNode(svg, "path", { d: `M${cx + 18} ${cy - 2}h18l-17 12`, fill: "#f4c7a3", stroke: palette.ink, "stroke-width": 5, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx + 12} ${cy + 17}h22`, ...lineAttrs(palette.accent, 5) });
  addSvgNode(svg, "path", { d: `M${cx - 21} ${cy + 32}c4 20 25 27 46 21`, ...lineAttrs(palette.ink, 7) });
}

function drawClipboard(svg, x, y, width, height, palette) {
  addSvgNode(svg, "rect", { x, y, width, height, rx: 10, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
  addSvgNode(svg, "rect", { x: x + 20, y: y - 10, width: width - 40, height: 17, rx: 7, fill: palette.accent });
  [y + 27, y + 50, y + 73].forEach((rowY) => {
    addSvgNode(svg, "rect", { x: x + 14, y: rowY - 8, width: 16, height: 16, rx: 3, fill: "#fff", stroke: palette.accent, "stroke-width": 3 });
    addSvgNode(svg, "path", { d: `M${x + 17} ${rowY - 1}l5 5 12-14`, ...lineAttrs(palette.secondary, 4) });
    addSvgNode(svg, "path", { d: `M${x + 41} ${rowY}h25`, ...lineAttrs(palette.ink, 4) });
  });
}

function drawCalendarCard(svg, x, y, palette) {
  addSvgNode(svg, "rect", { x, y, width: 45, height: 50, rx: 8, fill: "#fff", stroke: palette.ink, "stroke-width": 4 });
  addSvgNode(svg, "rect", { x, y, width: 45, height: 16, rx: 8, fill: palette.accent });
  [x + 13, x + 24, x + 35].forEach((dotX) => addSvgNode(svg, "circle", { cx: dotX, cy: y + 31, r: 4, fill: palette.secondary }));
}

function drawMapCard(svg, x, y, width, height, palette) {
  addSvgNode(svg, "rect", { x, y, width, height, rx: 10, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
  [x + 32, x + 65, x + 98].forEach((lineX) => addSvgNode(svg, "path", { d: `M${lineX} ${y + 9}v${height - 18}`, ...lineAttrs(palette.soft, 4) }));
  [y + 31, y + 61].forEach((lineY) => addSvgNode(svg, "path", { d: `M${x + 8} ${lineY}h${width - 16}`, ...lineAttrs(palette.soft, 4) }));
  addSvgNode(svg, "path", { d: `M${x + 18} ${y + 69}c25-31 55-7 91-43`, ...lineAttrs(palette.secondary, 7) });
  addSvgNode(svg, "circle", { cx: x + 18, cy: y + 69, r: 8, fill: palette.secondary });
  addSvgNode(svg, "path", { d: `M${x + 109} ${y + 26}c0-13 20-13 20 0 0 11-10 22-10 22s-10-11-10-22z`, fill: palette.accent, stroke: palette.ink, "stroke-width": 3, "stroke-linejoin": "round" });
}

function drawMemoryCards(svg, x, y, palette) {
  [[x, y], [x + 54, y], [x + 108, y], [x + 27, y + 61], [x + 81, y + 61]].forEach(([cardX, cardY], index) => {
    addSvgNode(svg, "rect", { x: cardX, y: cardY, width: 42, height: 54, rx: 7, fill: "#fff", stroke: palette.accent, "stroke-width": 4 });
    if (index % 2 === 0) {
      addSvgNode(svg, "circle", { cx: cardX + 21, cy: cardY + 27, r: 11, fill: palette.secondary });
    } else {
      addSvgNode(svg, "path", { d: `M${cardX + 21} ${cardY + 15}l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z`, fill: palette.secondary });
    }
  });
}

function drawSpeechBubble(svg, x, y, width, height, palette) {
  addSvgNode(svg, "path", { d: `M${x} ${y}h${width}a10 10 0 0 1 10 10v${height - 20}a10 10 0 0 1-10 10h-${Math.round(width * 0.35)}l-18 14 4-14h-${Math.round(width * 0.65) - 14}a10 10 0 0 1-10-10V${y + 10}a10 10 0 0 1 10-10z`, fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${x + 17} ${y + 21}h${width - 27}M${x + 17} ${y + 37}h${Math.max(28, width - 48)}`, ...lineAttrs(palette.secondary, 5) });
}

function drawDice(svg, x, y, palette) {
  addSvgNode(svg, "rect", { x, y, width: 48, height: 48, rx: 9, fill: "#fff", stroke: palette.ink, "stroke-width": 5 });
  [x + 14, x + 24, x + 34].forEach((dotX, index) => addSvgNode(svg, "circle", { cx: dotX, cy: y + 14 + index * 10, r: 4, fill: palette.accent }));
}

function drawPlayingCards(svg, x, y, palette) {
  addSvgNode(svg, "rect", { x, y, width: 39, height: 55, rx: 7, fill: "#fff", stroke: palette.secondary, "stroke-width": 5, transform: `rotate(-9 ${x + 18} ${y + 27})` });
  addSvgNode(svg, "rect", { x: x + 22, y: y + 6, width: 39, height: 55, rx: 7, fill: "#fff", stroke: palette.accent, "stroke-width": 5, transform: `rotate(7 ${x + 41} ${y + 34})` });
  addSvgNode(svg, "path", { d: `M${x + 41} ${y + 27}c-9-9-21 5 0 24 21-19 9-33 0-24z`, fill: palette.accent });
}

function drawHand(svg, cx, cy, palette, side) {
  const sign = side === "left" ? 1 : -1;
  addSvgNode(svg, "path", { d: `M${cx} ${cy}c${22 * sign}-21 ${48 * sign}-17 ${57 * sign} 4`, fill: "none", stroke: "#f4c7a3", "stroke-width": 15, "stroke-linecap": "round" });
  addSvgNode(svg, "circle", { cx: cx + 57 * sign, cy: cy + 5, r: 9, fill: "#f4c7a3" });
}

function drawOpenBook(svg, x, y, width, height, palette) {
  const half = width / 2;
  addSvgNode(svg, "path", { d: `M${x} ${y}h${half - 5}c10 0 17 7 17 17v${height - 4}c-7-8-17-12-31-12H${x}z`, fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${x + half + 5} ${y}h${half - 5}v${height - 16}h-${half - 5}c-10 0-17 4-22 12V${y + 17}c0-10 7-17 17-17z`, fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${x + 18} ${y + 24}h${half - 35}M${x + 18} ${y + 42}h${half - 43}M${x + half + 25} ${y + 24}h${half - 42}M${x + half + 25} ${y + 42}h${half - 51}`, ...lineAttrs(palette.secondary, 5) });
}

function drawPinwheelLarge(svg, cx, cy, palette) {
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l-28-30h56z`, fill: palette.secondary, stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l30-28v56z`, fill: "#fff", stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l28 30h-56z`, fill: palette.accent, stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
  addSvgNode(svg, "circle", { cx, cy, r: 7, fill: palette.ink });
  addSvgNode(svg, "path", { d: `M${cx} ${cy + 8}v62`, ...lineAttrs(palette.ink, 5) });
}

function drawIllustration(svg, config, palette) {
  addSvgNode(svg, "rect", { width: 220, height: 120, rx: 16, fill: palette.bg });
  addSvgNode(svg, "rect", { x: 0, y: 82, width: 220, height: 38, fill: palette.soft, opacity: 0.78 });
  addSvgNode(svg, "circle", { cx: 190, cy: 24, r: 22, fill: palette.soft, opacity: 0.85 });
  drawConcreteScene(svg, config.kind, palette);
}

function drawConcreteScene(svg, kind, palette) {
  if (kind === "checklist") {
    addSvgNode(svg, "rect", { x: 24, y: 22, width: 74, height: 78, rx: 10, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "rect", { x: 42, y: 14, width: 38, height: 14, rx: 6, fill: palette.accent });
    [43, 61, 79].forEach((y) => {
      addSvgNode(svg, "rect", { x: 39, y: y - 7, width: 13, height: 13, rx: 3, fill: "#fff", stroke: palette.accent, "stroke-width": 3 });
      addSvgNode(svg, "path", { d: `M42 ${y - 1}l4 4 9-11`, ...lineAttrs(palette.secondary, 3) });
      addSvgNode(svg, "path", { d: `M62 ${y}h22`, ...lineAttrs(palette.ink, 4) });
    });
    drawCalendar(svg, 125, 29, palette);
    drawClock(svg, 167, 77, palette);
    return;
  }

  if (kind === "eyeGrid") {
    addSvgNode(svg, "rect", { x: 27, y: 22, width: 104, height: 78, rx: 10, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    [52, 78, 104].forEach((x) => addSvgNode(svg, "path", { d: `M${x} 30v62`, ...lineAttrs(palette.soft, 4) }));
    [47, 69].forEach((y) => addSvgNode(svg, "path", { d: `M36 ${y}h86`, ...lineAttrs(palette.soft, 4) }));
    addSvgNode(svg, "path", { d: "M42 81c24-28 51-11 78-40", ...lineAttrs(palette.secondary, 6) });
    addSvgNode(svg, "circle", { cx: 42, cy: 81, r: 7, fill: palette.secondary });
    addSvgNode(svg, "circle", { cx: 120, cy: 41, r: 7, fill: palette.secondary });
    addSvgNode(svg, "path", { d: "M146 61c16-19 45-19 61 0-16 18-45 18-61 0z", fill: "#fff", stroke: palette.ink, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "circle", { cx: 176, cy: 61, r: 10, fill: palette.accent });
    return;
  }

  if (kind === "target") {
    addSvgNode(svg, "rect", { x: 37, y: 74, width: 126, height: 13, rx: 6, fill: palette.accent });
    addSvgNode(svg, "circle", { cx: 70, cy: 51, r: 15, fill: "#fff", stroke: palette.ink, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M58 70c5-13 20-13 25 0", fill: "#fff", stroke: palette.ink, "stroke-width": 5, "stroke-linecap": "round" });
    addSvgNode(svg, "path", { d: "M108 76l21-43h36l-20 43z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M147 27l14-12M149 36l20-3M142 22l3-16", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "rect", { x: 91, y: 88, width: 86, height: 7, rx: 3, fill: palette.ink, opacity: 0.42 });
    return;
  }

  if (kind === "memory") {
    addSvgNode(svg, "rect", { x: 35, y: 28, width: 45, height: 56, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "rect", { x: 89, y: 28, width: 45, height: 56, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "rect", { x: 143, y: 28, width: 45, height: 56, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    drawStar(svg, 58, 55, 13, palette.secondary);
    addSvgNode(svg, "circle", { cx: 112, cy: 55, r: 12, fill: palette.secondary });
    drawStar(svg, 166, 55, 13, palette.secondary);
    addSvgNode(svg, "path", { d: "M55 94h112", ...lineAttrs(palette.ink, 5) });
    return;
  }

  if (kind === "speech") {
    drawSimplePerson(svg, 57, 75, palette, "left");
    drawSimplePerson(svg, 157, 75, palette, "right");
    addSvgNode(svg, "path", { d: "M61 24h62a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10H91L72 78l4-14H61a10 10 0 0 1-10-10V34a10 10 0 0 1 10-10z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M73 43h38M73 54h25", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "circle", { cx: 117, cy: 54, r: 3.5, fill: palette.ink });
    addSvgNode(svg, "circle", { cx: 127, cy: 54, r: 3.5, fill: palette.ink });
    return;
  }

  if (kind === "games") {
    addSvgNode(svg, "rect", { x: 34, y: 48, width: 45, height: 45, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    [48, 64].forEach((x) => [62, 78].forEach((y) => addSvgNode(svg, "circle", { cx: x, cy: y, r: 4, fill: palette.ink })));
    addSvgNode(svg, "rect", { x: 98, y: 35, width: 39, height: 56, rx: 7, fill: "#fff", stroke: palette.secondary, "stroke-width": 5, transform: "rotate(-9 118 63)" });
    addSvgNode(svg, "path", { d: "M117 52c-10-10-25 6 0 24 25-18 10-34 0-24z", fill: palette.accent });
    addSvgNode(svg, "path", { d: "M161 34h24v51h-24zM173 21v13", fill: "#fff", stroke: palette.ink, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "circle", { cx: 173, cy: 28, r: 9, fill: palette.secondary });
    return;
  }

  if (kind === "book") {
    addSvgNode(svg, "path", { d: "M35 35h61c10 0 17 7 17 17v48c-5-6-12-9-21-9H35z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M113 52c0-10 7-17 17-17h55v56h-61c-6 0-10 3-11 9z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M54 55h31M54 71h24M134 55h31M134 71h24", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "path", { d: "M159 90l22-34 10 7-22 34-12 5z", fill: "#fff", stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
    return;
  }

  if (kind === "tablet") {
    addSvgNode(svg, "rect", { x: 45, y: 20, width: 130, height: 82, rx: 13, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    [75, 110, 145].forEach((x) => [48, 75].forEach((y) => addSvgNode(svg, "rect", { x: x - 11, y: y - 11, width: 22, height: 22, rx: 6, fill: y < 60 ? palette.secondary : palette.soft, stroke: palette.ink, "stroke-width": 2, opacity: 0.98 })));
    addSvgNode(svg, "circle", { cx: 110, cy: 96, r: 4, fill: palette.ink });
    return;
  }

  if (kind === "swallow") {
    addSvgNode(svg, "circle", { cx: 74, cy: 43, r: 22, fill: "#fff", stroke: palette.ink, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M76 45c15 2 24 9 27 23 3 13-3 24-17 31", ...lineAttrs(palette.ink, 6) });
    addSvgNode(svg, "path", { d: "M45 43h26M67 52h-8", ...lineAttrs(palette.ink, 5) });
    addSvgNode(svg, "path", { d: "M119 30h32l-7 58h-18z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M105 56c18 2 28 13 28 30", ...lineAttrs(palette.secondary, 6) });
    addSvgNode(svg, "path", { d: "M176 38c9 13 10 27 1 40", ...lineAttrs(palette.accent, 5) });
    return;
  }

  if (kind === "tooth") {
    addSvgNode(svg, "path", { d: "M76 27c-19 0-29 15-23 37l10 36c4 14 17 11 22-1l8-24 8 24c5 12 18 15 22 1l10-36c6-22-4-37-23-37-9 0-13 5-17 5s-8-5-17-5z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M129 83l50-29", ...lineAttrs(palette.secondary, 9) });
    addSvgNode(svg, "path", { d: "M172 42l15 26", ...lineAttrs(palette.ink, 5) });
    addSvgNode(svg, "rect", { x: 151, y: 42, width: 31, height: 14, rx: 6, fill: "#fff", stroke: palette.ink, "stroke-width": 4, transform: "rotate(-30 166 49)" });
    return;
  }

  if (kind === "posture") {
    addSvgNode(svg, "circle", { cx: 70, cy: 36, r: 13, fill: palette.secondary });
    addSvgNode(svg, "path", { d: "M70 52v29h44", ...lineAttrs(palette.ink, 7) });
    addSvgNode(svg, "path", { d: "M119 28v70h40M118 66h49", ...lineAttrs(palette.accent, 7) });
    addSvgNode(svg, "rect", { x: 126, y: 48, width: 48, height: 10, rx: 5, fill: palette.ink });
    addSvgNode(svg, "circle", { cx: 150, cy: 43, r: 11, fill: "#fff", stroke: palette.secondary, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M40 99h142", ...lineAttrs(palette.ink, 5) });
    return;
  }

  if (kind === "breath") {
    addSvgNode(svg, "circle", { cx: 62, cy: 58, r: 20, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M52 58h20", ...lineAttrs(palette.ink, 5) });
    addSvgNode(svg, "path", { d: "M93 42c26-12 50-6 58 9M95 61c25-8 43-1 51 10M94 80c22-4 36 0 44 9", ...lineAttrs(palette.secondary, 6) });
    drawPinwheel(svg, 170, 58, palette);
    return;
  }

  if (kind === "smell") {
    addSvgNode(svg, "path", { d: "M67 32c-14 20-16 35-5 45 9 8 22 5 28-6", ...lineAttrs(palette.ink, 6) });
    addSvgNode(svg, "path", { d: "M125 82v-31", ...lineAttrs(palette.accent, 5) });
    [[125, 42], [108, 55], [142, 55], [115, 72], [135, 72]].forEach(([x, y]) => addSvgNode(svg, "circle", { cx: x, cy: y, r: 11, fill: palette.secondary }));
    addSvgNode(svg, "circle", { cx: 125, cy: 60, r: 9, fill: "#fff", stroke: palette.accent, "stroke-width": 4 });
    addSvgNode(svg, "path", { d: "M164 44c13-9 25-9 34-1M164 63c16-6 28-4 36 4", ...lineAttrs(palette.accent, 5) });
    return;
  }

  if (kind === "relax") {
    addSvgNode(svg, "circle", { cx: 75, cy: 43, r: 15, fill: palette.secondary });
    addSvgNode(svg, "path", { d: "M52 83c25-27 61-28 89-5", ...lineAttrs(palette.ink, 8) });
    addSvgNode(svg, "path", { d: "M119 52c23-12 46-5 54 10M122 72c19-5 35-2 45 8", ...lineAttrs(palette.accent, 5) });
    addSvgNode(svg, "path", { d: "M44 97h140", ...lineAttrs(palette.ink, 5) });
    return;
  }

  if (kind === "support") {
    drawSimplePerson(svg, 68, 76, palette, "left");
    drawSimplePerson(svg, 111, 70, palette, "front");
    drawSimplePerson(svg, 154, 76, palette, "right");
    addSvgNode(svg, "path", { d: "M65 31h90a11 11 0 0 1 11 11v18a11 11 0 0 1-11 11h-33l-19 13 4-13H65a11 11 0 0 1-11-11V42a11 11 0 0 1 11-11z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M78 51h63", ...lineAttrs(palette.secondary, 5) });
    return;
  }

  if (kind === "bowl") {
    addSvgNode(svg, "path", { d: "M55 59h104c-5 27-24 41-52 41S60 86 55 59z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M76 49c9-9 23-9 32 0M116 49c9-9 23-9 32 0", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "path", { d: "M158 27l-39 42", ...lineAttrs(palette.ink, 7) });
    addSvgNode(svg, "rect", { x: 157, y: 69, width: 33, height: 25, rx: 7, fill: "#fff", stroke: palette.secondary, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M163 82h21", ...lineAttrs(palette.ink, 4) });
    return;
  }

  if (kind === "heart") {
    addSvgNode(svg, "circle", { cx: 70, cy: 57, r: 24, fill: "#fff", stroke: palette.ink, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M57 56c8 7 18 7 26 0", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "path", { d: "M140 90c-30-20-47-34-40-51 6-16 26-16 37-3 11-13 31-13 37 3 7 17-10 31-34 51z", fill: "#fff", stroke: palette.accent, "stroke-width": 5, "stroke-linejoin": "round" });
    addSvgNode(svg, "path", { d: "M121 58h14l7-12 8 25 7-13h15", ...lineAttrs(palette.secondary, 5) });
    return;
  }

  if (kind === "story") {
    drawSimplePerson(svg, 55, 76, palette, "front");
    addSvgNode(svg, "rect", { x: 98, y: 25, width: 68, height: 75, rx: 8, fill: "#fff", stroke: palette.accent, "stroke-width": 5 });
    addSvgNode(svg, "path", { d: "M113 45h38M113 62h29M113 79h35", ...lineAttrs(palette.secondary, 5) });
    addSvgNode(svg, "path", { d: "M73 28h40a9 9 0 0 1 9 9v15a9 9 0 0 1-9 9H92L78 73l3-12h-8a9 9 0 0 1-9-9V37a9 9 0 0 1 9-9z", fill: "#fff", stroke: palette.ink, "stroke-width": 4, "stroke-linejoin": "round" });
    return;
  }

  drawConcreteScene(svg, "book", palette);
}

function drawCalendar(svg, x, y, palette) {
  addSvgNode(svg, "rect", { x, y, width: 48, height: 45, rx: 7, fill: "#fff", stroke: palette.accent, "stroke-width": 4 });
  addSvgNode(svg, "rect", { x, y, width: 48, height: 14, rx: 7, fill: palette.accent });
  [x + 13, x + 25, x + 37].forEach((dotX) => {
    addSvgNode(svg, "circle", { cx: dotX, cy: y + 26, r: 3, fill: palette.secondary });
    addSvgNode(svg, "circle", { cx: dotX, cy: y + 36, r: 3, fill: palette.soft });
  });
}

function drawClock(svg, cx, cy, palette) {
  addSvgNode(svg, "circle", { cx, cy, r: 19, fill: "#fff", stroke: palette.ink, "stroke-width": 5 });
  addSvgNode(svg, "path", { d: `M${cx} ${cy - 9}v11l9 6`, ...lineAttrs(palette.secondary, 4) });
}

function drawStar(svg, cx, cy, radius, fill) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const r = index % 2 === 0 ? radius : radius * 0.45;
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  }).join(" ");

  addSvgNode(svg, "polygon", { points, fill });
}

function drawSimplePerson(svg, cx, cy, palette, direction) {
  const shoulderWidth = direction === "front" ? 48 : 42;
  addSvgNode(svg, "circle", { cx, cy: cy - 34, r: 13, fill: palette.secondary });
  addSvgNode(svg, "path", {
    d: `M${cx - shoulderWidth / 2} ${cy + 12}c4-26 44-26 ${shoulderWidth} 0z`,
    fill: "#fff",
    stroke: palette.accent,
    "stroke-width": 5,
    "stroke-linejoin": "round",
  });

  if (direction === "left") {
    addSvgNode(svg, "path", { d: `M${cx - 3} ${cy - 36}h-11`, ...lineAttrs(palette.ink, 4) });
  } else if (direction === "right") {
    addSvgNode(svg, "path", { d: `M${cx + 3} ${cy - 36}h11`, ...lineAttrs(palette.ink, 4) });
  } else {
    addSvgNode(svg, "path", { d: `M${cx - 8} ${cy - 36}h16`, ...lineAttrs(palette.ink, 4) });
  }
}

function drawPinwheel(svg, cx, cy, palette) {
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l-17-18h34z`, fill: palette.secondary, stroke: palette.ink, "stroke-width": 3, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l18-17v34z`, fill: "#fff", stroke: palette.ink, "stroke-width": 3, "stroke-linejoin": "round" });
  addSvgNode(svg, "path", { d: `M${cx} ${cy}l17 18h-34z`, fill: palette.accent, stroke: palette.ink, "stroke-width": 3, "stroke-linejoin": "round" });
  addSvgNode(svg, "circle", { cx, cy, r: 5, fill: palette.ink });
  addSvgNode(svg, "path", { d: `M${cx} ${cy + 5}v34`, ...lineAttrs(palette.ink, 4) });
}

function lineAttrs(color, width) {
  return {
    fill: "none",
    stroke: color,
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
}

function createSvgNode(tag, attributes) {
  const node = document.createElementNS(svgNamespace, tag);
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, String(value));
  });
  return node;
}

function addSvgNode(parent, tag, attributes) {
  const node = createSvgNode(tag, attributes);
  parent.append(node);
  return node;
}

function openResourceModal(resourceId) {
  const resource = resourcesById[resourceId];

  if (!resource) {
    return;
  }

  closeResourceModal({ restoreFocus: false });
  previousFocus = document.activeElement;

  const modal = document.createElement("div");
  modal.className = "resource-modal";
  modal.dataset.resourceId = resourceId;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "resourceModalTitle");

  const closeButton = document.createElement("button");
  closeButton.className = "modal-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Fermer");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => closeResourceModal());

  const header = document.createElement("header");
  header.className = "modal-header";

  const titleBlock = document.createElement("div");
  titleBlock.className = "modal-title-block";

  const tag = document.createElement("span");
  tag.className = `tag ${resource.tagClass}`;
  tag.textContent = resource.section;

  const title = document.createElement("h2");
  title.id = "resourceModalTitle";
  title.textContent = resource.title;

  const headerActions = document.createElement("div");
  headerActions.className = "modal-actions";

  if (isAdminLoggedIn) {
    const editButton = document.createElement("button");
    editButton.className = "modal-edit";
    editButton.type = "button";
    editButton.textContent = "Modifier";
    editButton.addEventListener("click", () => {
      closeResourceModal({ restoreFocus: false });
      openResourceEditor(resource.id);
    });
    headerActions.append(editButton);
  }

  titleBlock.append(tag);

  if (resource.format === "questionnaire") {
    const formatBadge = document.createElement("span");
    formatBadge.className = "questionnaire-format-badge";
    formatBadge.textContent = "Questionnaire anonyme";
    titleBlock.append(formatBadge);
  }

  if (resource.isHidden && isAdminLoggedIn) {
    const hiddenBadge = document.createElement("span");
    hiddenBadge.className = "hidden-resource-badge";
    hiddenBadge.textContent = "Masquée";
    titleBlock.append(hiddenBadge);
  }

  titleBlock.append(title);
  headerActions.append(closeButton);
  header.append(titleBlock, headerActions);

  const body = document.createElement("div");
  body.className = "modal-body";
  if (resource.format === "questionnaire") {
    body.classList.add("is-questionnaire-modal-body");
  }

  const content = document.createElement("section");
  content.className = "modal-text";

  if (resource.body || resource.summary) {
    const text = document.createElement("p");
    text.textContent = resource.body || resource.summary;
    content.append(text);
  }

  const viewer = createAttachmentViewer(resource);
  if (viewer) {
    body.append(viewer);
  }

  body.append(content);

  const commentsSlot = document.createElement("div");
  commentsSlot.className = "modal-comments-slot";
  commentsSlot.append(createCommentArea(resource.id, { open: true }));

  const shell = document.createElement("div");
  shell.className = "modal-shell";
  shell.append(header, body);
  if (resource.format === "questionnaire") {
    shell.append(createQuestionnairePanel(resource));
  }
  shell.append(commentsSlot);

  modal.append(shell);
  document.body.append(modal);
  document.body.classList.add("modal-open");
  panelNode.inert = true;
  panelNode.setAttribute("inert", "");
  panelNode.setAttribute("aria-hidden", "true");
  activeModal = modal;
  updateViewerMenuOffset();
  window.addEventListener("resize", updateViewerMenuOffset);
  closeButton.focus();
}

function createQuestionnairePanel(resource) {
  const panel = document.createElement("section");
  panel.className = "questionnaire-panel";
  panel.setAttribute("aria-labelledby", "questionnairePanelTitle");

  const heading = document.createElement("div");
  heading.className = "questionnaire-heading";

  const title = document.createElement("h3");
  title.id = "questionnairePanelTitle";
  title.textContent = isAdminLoggedIn ? "Réponses au questionnaire" : "Questionnaire anonyme";

  const privacy = document.createElement("p");
  privacy.textContent = isAdminLoggedIn
    ? "Les réponses ci-dessous ne comportent ni nom ni coordonnées."
    : "Aucun nom, numéro de téléphone ou courriel n'est demandé. Ne donnez pas d'information permettant de vous identifier dans les réponses libres.";

  heading.append(title, privacy);
  panel.append(heading);

  if (isAdminLoggedIn) {
    panel.append(createQuestionnaireAdminResults(resource));
  } else {
    panel.append(createQuestionnaireResponseForm(resource));
  }

  return panel;
}

function createQuestionnaireResponseForm(resource) {
  const form = document.createElement("form");
  form.className = "questionnaire-response-form";
  const questions = resource.questionnaire.questions;

  questions.forEach((question, index) => {
    form.append(createPublicQuestionField(question, index));
  });

  const notice = document.createElement("p");
  notice.className = "questionnaire-notice";
  notice.hidden = true;
  notice.setAttribute("role", "status");
  notice.tabIndex = -1;

  const submit = document.createElement("button");
  submit.className = "questionnaire-submit";
  submit.type = "submit";
  submit.textContent = "Envoyer mes réponses";

  form.append(notice, submit);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    notice.hidden = true;
    const answers = readQuestionnaireAnswers(form, questions);
    const stopLoading = startLoading("Envoi des réponses...");
    const stopSubmitLoading = setControlLoading(submit, "Envoi...");

    try {
      if (apiEnabled) {
        await apiRequest(`/api/questionnaires/${encodeURIComponent(resource.id)}/responses`, {
          method: "POST",
          body: { answers },
        });
      } else {
        const response = normalizeQuestionnaireResponse({
          id: createCommentId(),
          createdAt: new Date().toISOString(),
          answers,
        });
        questionnaireResponseState[resource.id] = [
          response,
          ...(questionnaireResponseState[resource.id] ?? []),
        ];
        saveQuestionnaireResponseStateLocally();
      }

      form.reset();
      notice.className = "questionnaire-notice is-success";
      notice.textContent = "Merci. Vos réponses anonymes ont bien été envoyées.";
      notice.hidden = false;
      notice.focus({ preventScroll: true });
    } catch {
      notice.className = "questionnaire-notice is-error";
      notice.textContent = "L'envoi a échoué. Vérifiez votre connexion puis réessayez.";
      notice.hidden = false;
    } finally {
      stopSubmitLoading();
      stopLoading();
    }
  });

  return form;
}

function createPublicQuestionField(question, index) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "questionnaire-question";
  fieldset.dataset.questionId = question.id;

  const legend = document.createElement("legend");
  legend.textContent = `${index + 1}. ${question.prompt}${question.required ? " *" : ""}`;
  fieldset.append(legend);

  if (question.type === "single") {
    const choices = document.createElement("div");
    choices.className = "questionnaire-choices";
    question.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${question.id}`;
      input.value = option;
      input.required = question.required && optionIndex === 0;
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      choices.append(label);
    });
    fieldset.append(choices);
    return fieldset;
  }

  if (question.type === "scale") {
    const scale = document.createElement("div");
    scale.className = "questionnaire-scale";
    for (let value = 1; value <= 5; value += 1) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${question.id}`;
      input.value = String(value);
      input.required = question.required && value === 1;
      const text = document.createElement("span");
      text.textContent = String(value);
      label.append(input, text);
      scale.append(label);
    }
    const scaleHelp = document.createElement("p");
    scaleHelp.className = "questionnaire-scale-help";
    scaleHelp.innerHTML = "<span>1 : Pas du tout</span><span>5 : Tout à fait</span>";
    fieldset.append(scale, scaleHelp);
    return fieldset;
  }

  const input = document.createElement(question.type === "long" ? "textarea" : "input");
  input.name = `question-${question.id}`;
  input.required = question.required;
  input.maxLength = question.type === "long" ? 4000 : 500;
  if (question.type === "long") {
    input.rows = 5;
  } else {
    input.type = "text";
  }
  fieldset.append(input);
  return fieldset;
}

function readQuestionnaireAnswers(form, questions) {
  return questions.flatMap((question) => {
    const field = form.elements.namedItem(`question-${question.id}`);
    let value = "";

    if (field instanceof RadioNodeList) {
      value = field.value;
    } else if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      value = field.value.trim();
    }

    return value
      ? [{ questionId: question.id, prompt: question.prompt, value }]
      : [];
  });
}

function createQuestionnaireAdminResults(resource) {
  const wrapper = document.createElement("div");
  wrapper.className = "questionnaire-results";
  const responses = questionnaireResponseState[resource.id] ?? [];

  const count = document.createElement("p");
  count.className = "questionnaire-response-count";
  count.textContent = `${responses.length} ${responses.length > 1 ? "réponses anonymes" : "réponse anonyme"}`;
  wrapper.append(count);

  if (responses.length === 0) {
    const empty = document.createElement("p");
    empty.className = "questionnaire-results-empty";
    empty.textContent = "Aucune réponse pour le moment.";
    wrapper.append(empty);
    return wrapper;
  }

  responses.forEach((response, index) => {
    const item = document.createElement("article");
    item.className = "questionnaire-response-item";

    const itemHeader = document.createElement("div");
    itemHeader.className = "questionnaire-response-header";
    const itemTitle = document.createElement("h4");
    itemTitle.textContent = `Réponse ${responses.length - index}`;
    const date = document.createElement("p");
    date.textContent = response.createdAt ? formatDate(response.createdAt) : "Date non disponible";
    itemHeader.append(itemTitle, date);

    const answers = document.createElement("dl");
    response.answers.forEach((answer) => {
      const question = document.createElement("dt");
      question.textContent = answer.prompt;
      const value = document.createElement("dd");
      const currentQuestion = resource.questionnaire.questions.find(
        (itemQuestion) => itemQuestion.id === answer.questionId,
      );
      value.textContent = currentQuestion?.type === "scale"
        ? `${String(answer.value)} sur 5`
        : Array.isArray(answer.value)
          ? answer.value.join(", ")
          : String(answer.value);
      answers.append(question, value);
    });

    const remove = document.createElement("button");
    remove.className = "admin-button admin-danger-button questionnaire-delete-response";
    remove.type = "button";
    remove.textContent = "Supprimer cette réponse";
    remove.addEventListener("click", async () => {
      if (!window.confirm("Supprimer définitivement cette réponse anonyme ?")) {
        return;
      }
      await deleteQuestionnaireResponse(resource.id, response.id, remove);
    });

    item.append(itemHeader, answers, remove);
    wrapper.append(item);
  });

  return wrapper;
}

async function deleteQuestionnaireResponse(resourceId, responseId, control) {
  const stopLoading = startLoading("Suppression de la réponse...");
  const stopControlLoading = setControlLoading(control, "Suppression...");

  try {
    if (apiEnabled) {
      const result = await apiRequest(
        `/api/questionnaires/${encodeURIComponent(resourceId)}/responses/${encodeURIComponent(responseId)}`,
        { method: "DELETE", auth: true },
      );
      questionnaireResponseState[resourceId] = (result.responses ?? [])
        .map(normalizeQuestionnaireResponse)
        .filter(Boolean);
    } else {
      questionnaireResponseState[resourceId] = (questionnaireResponseState[resourceId] ?? [])
        .filter((response) => response.id !== responseId);
      saveQuestionnaireResponseStateLocally();
    }

    refreshQuestionnairePanel(resourceId);
  } catch {
    window.alert("La réponse n'a pas pu être supprimée. Vérifiez la connexion puis réessayez.");
  } finally {
    stopControlLoading();
    stopLoading();
  }
}

function refreshQuestionnairePanel(resourceId) {
  if (!activeModal || activeModal.dataset.resourceId !== resourceId) {
    return;
  }

  const resource = resourcesById[resourceId];
  const panel = activeModal.querySelector(".questionnaire-panel");
  if (resource && panel) {
    panel.replaceWith(createQuestionnairePanel(resource));
  }
}

function closeResourceModal(options = {}) {
  const { restoreFocus = true } = options;

  if (!activeModal) {
    return;
  }

  activeModal.remove();
  activeModal = null;
  document.body.classList.remove("modal-open");
  panelNode.inert = false;
  panelNode.removeAttribute("inert");
  panelNode.removeAttribute("aria-hidden");
  document.documentElement.style.removeProperty("--viewer-header-offset");
  document.documentElement.style.removeProperty("--viewer-menu-offset");
  window.removeEventListener("resize", updateViewerMenuOffset);

  if (restoreFocus && previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }

  previousFocus = null;
}

function trapFocus(event, root, options = {}) {
  const { includeTabs = false } = options;
  const focusable = [
    ...(includeTabs ? tabsNode.querySelectorAll(focusableSelector) : []),
    ...root.querySelectorAll(focusableSelector),
  ].filter((node) => node instanceof HTMLElement && node.offsetParent !== null);

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function updateViewerMenuOffset() {
  const headerHeight = headerNode ? Math.ceil(headerNode.getBoundingClientRect().height) : 0;
  const menuHeight = menuNode ? Math.ceil(menuNode.getBoundingClientRect().height) : 0;

  document.documentElement.style.setProperty("--viewer-header-offset", `${headerHeight}px`);
  document.documentElement.style.setProperty("--viewer-menu-offset", `${headerHeight + menuHeight}px`);
}

function createAttachmentViewer(resource) {
  const attachment = resource.attachment;

  if (!attachment) {
    return null;
  }

  const kind = attachment.kind || "";
  const section = document.createElement("section");
  section.className = "attachment-viewer";

  if (isImageResource(attachment)) {
    const image = document.createElement("img");
    image.className = "viewer-image";
    image.src = attachment.url;
    image.alt = resource.title;
    section.append(image);
    return section;
  }

  if (kind.startsWith("video/")) {
    const video = document.createElement("video");
    video.className = "viewer-video";
    video.src = attachment.url;
    video.controls = true;
    section.append(video);
    return section;
  }

  const youtubeUrl = getYouTubeEmbedUrl(attachment.url);
  if (youtubeUrl) {
    section.append(createFrame(youtubeUrl, resource.title));
    section.append(createOpenFileLink(attachment));
    return section;
  }

  if (attachment.viewerUrl) {
    section.append(createFrame(attachment.viewerUrl, resource.title));
    section.append(createOpenFileLink(attachment));
    return section;
  }

  if (kind.includes("pdf")) {
    section.append(createFrame(attachment.url, resource.title));
    section.append(createOpenFileLink(attachment));
    return section;
  }

  if (kind === "text/html" && attachment.storage !== "browser") {
    section.append(createExternalResourcePanel(resource, attachment));
    return section;
  }

  section.append(createOpenFileLink(attachment));
  return section;
}

function createFrame(url, title) {
  const frame = document.createElement("iframe");
  frame.className = "viewer-frame";
  frame.src = url;
  frame.title = title;
  frame.loading = "lazy";
  return frame;
}

function createOpenFileLink(attachment) {
  const link = document.createElement("a");
  link.className = "open-file-link";
  link.href = attachment.url;

  if (attachment.storage === "browser") {
    link.download = attachment.label || "ressource";
    link.textContent = "Télécharger le fichier";
    return link;
  }

  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ouvrir dans un nouvel onglet";
  return link;
}

function createExternalResourcePanel(resource, attachment) {
  const panel = document.createElement("div");
  panel.className = "external-resource-panel";

  const title = document.createElement("h3");
  title.textContent = resource.title;

  const text = document.createElement("p");
  text.textContent =
    "Cette ressource ne peut pas être affichée directement dans la page. Elle s'ouvre dans un nouvel onglet.";

  const link = document.createElement("a");
  link.className = "external-resource-link";
  link.href = attachment.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = isBookLink(attachment.url) ? "Ouvrir le livre conseillé" : "Ouvrir la ressource";

  panel.append(title, text, link);
  return panel;
}

function isBookLink(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("amazon.") || host === "amzn.eu";
  } catch {
    return false;
  }
}

function getYouTubeThumbnailUrl(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function getYouTubeEmbedUrl(url) {
  const id = getYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function getYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.replace("/", "").split("/")[0];
    }

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

function createCommentArea(resourceId, options = {}) {
  const { open = false, notice = "" } = options;
  const resource = resourcesById[resourceId];
  const comments = getCommentTree(resourceId, { includePending: isAdminLoggedIn });
  const approvedCount = getApprovedCommentCount(resourceId);
  const pendingCount = getPendingCommentCount(resourceId);
  const area = document.createElement("section");
  area.className = "comment-area";
  area.setAttribute("aria-label", `Commentaires pour ${resource.title}`);

  const details = document.createElement("details");
  details.className = "comment-details";
  details.open = open;

  const header = document.createElement("summary");
  header.className = "comment-header";

  const title = document.createElement("span");
  title.className = "comment-title";
  title.textContent = "Commentaires";

  const count = document.createElement("span");
  count.className = "comment-count";
  count.textContent = isAdminLoggedIn && pendingCount > 0
    ? `${formatCommentCount(approvedCount)} · ${formatPendingCommentCount(pendingCount)}`
    : formatCommentCount(approvedCount);

  header.append(title, count);
  details.append(header);

  const content = document.createElement("div");
  content.className = "comment-content";

  if (notice) {
    const noticeText = document.createElement("p");
    noticeText.className = "comment-notice";
    noticeText.textContent = notice;
    content.append(noticeText);
  }

  content.append(createCommentForm(resourceId));

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-comments";
    empty.textContent = "Aucun commentaire pour le moment.";
    content.append(empty);
    details.append(content);
    area.append(details);
    return area;
  }

  const list = document.createElement("div");
  list.className = "comments-list";
  comments.forEach((comment) => list.append(createCommentItem(resourceId, comment)));
  content.append(list);
  details.append(content);
  area.append(details);
  return area;
}

function createCommentForm(resourceId) {
  const form = document.createElement("form");
  form.className = "comment-form";
  form.dataset.resourceId = resourceId;

  const nameLabel = createFieldLabel("Nom", "input", {
    type: "text",
    name: "author",
    placeholder: "Ex. Marie",
    autocomplete: "name",
  });

  const messageLabel = createFieldLabel("Commentaire", "textarea", {
    name: "message",
    placeholder: "Ajouter une observation ou une idée de ressource...",
    required: "true",
  });

  const button = document.createElement("button");
  button.className = "submit-comment";
  button.type = "submit";
  button.textContent = isAdminLoggedIn ? "Ajouter" : "Envoyer pour validation";

  form.append(nameLabel, messageLabel, button);
  form.addEventListener("submit", handleCommentSubmit);
  return form;
}

function createFieldLabel(labelText, elementName, attributes) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;

  const field = document.createElement(elementName);
  Object.entries(attributes).forEach(([key, value]) => {
    field.setAttribute(key, value);
  });

  label.append(span, field);
  return label;
}

function createCommentItem(resourceId, comment) {
  const item = document.createElement("div");
  item.className = "comment-item";
  if (comment.status === "pending") {
    item.classList.add("is-pending-comment");
  }

  const meta = document.createElement("div");
  meta.className = "comment-meta";

  const author = document.createElement("span");
  author.className = "comment-author";
  author.textContent = comment.author;

  const date = document.createElement("span");
  date.className = "comment-date";
  date.textContent = comment.createdAt ? formatDate(comment.createdAt) : "";

  meta.append(author, date);

  if (comment.status === "pending") {
    const pending = document.createElement("span");
    pending.className = "comment-status";
    pending.textContent = "En attente de validation";
    meta.append(pending);
  }

  const text = document.createElement("p");
  text.className = "comment-text";
  text.textContent = comment.message;

  item.append(meta, text);

  if (isAdminLoggedIn) {
    const actions = document.createElement("div");
    actions.className = "comment-actions";

    if (comment.status === "pending" && !comment.readonly) {
      const approve = document.createElement("button");
      approve.className = "approve-comment";
      approve.type = "button";
      approve.textContent = "Valider";
      approve.addEventListener("click", () => approveComment(resourceId, comment.id, approve));
      actions.append(approve);
    }

    actions.append(createReplyDetails(resourceId, comment.id));

    if (!comment.readonly) {
      const remove = document.createElement("button");
      remove.className = "delete-comment";
      remove.type = "button";
      remove.textContent = "Supprimer";
      remove.addEventListener("click", () => deleteComment(resourceId, comment.id, remove));
      actions.append(remove);
    }

    item.append(actions);
  }

  if (comment.children.length > 0) {
    const replies = document.createElement("div");
    replies.className = "comment-replies";
    comment.children.forEach((child) => replies.append(createCommentItem(resourceId, child)));
    item.append(replies);
  }

  return item;
}

function createReplyDetails(resourceId, parentId) {
  const details = document.createElement("details");
  details.className = "reply-details";

  const summary = document.createElement("summary");
  summary.textContent = "Répondre";

  details.append(summary, createReplyForm(resourceId, parentId));
  return details;
}

function createReplyForm(resourceId, parentId) {
  const form = document.createElement("form");
  form.className = "comment-form reply-form";
  form.dataset.resourceId = resourceId;
  form.dataset.parentId = parentId;
  form.dataset.reply = "true";

  const messageLabel = createFieldLabel("Réponse d'Audrey Fabre", "textarea", {
    name: "message",
    placeholder: "Répondre à ce commentaire...",
    required: "true",
  });

  const button = document.createElement("button");
  button.className = "submit-comment";
  button.type = "submit";
  button.textContent = "Répondre";

  form.append(messageLabel, button);
  form.addEventListener("submit", handleCommentSubmit);
  return form;
}

async function handleCommentSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const resourceId = form.dataset.resourceId;
  const parentId = form.dataset.parentId ?? "";
  const isReply = form.dataset.reply === "true";
  const message = String(formData.get("message") ?? "").trim();

  if (!message) {
    return;
  }

  const author = isReply
    ? "Audrey Fabre"
    : String(formData.get("author") ?? "").trim() || (isAdminLoggedIn ? "Audrey Fabre" : "Anonyme");
  const status = isAdminLoggedIn ? "approved" : "pending";
  const comment = {
    id: createCommentId(),
    author,
    message,
    createdAt: new Date().toISOString(),
    parentId,
    status,
    isReply,
  };
  const loadingMessage = isReply ? "Envoi de la réponse..." : "Envoi du commentaire...";
  const buttonMessage = isReply ? "Réponse..." : "Envoi...";
  const stopLoading = startLoading(loadingMessage);
  const stopSubmitLoading = setFormLoading(form, buttonMessage);

  try {
    if (apiEnabled) {
      try {
        await apiRequest(`/api/comments/${encodeURIComponent(resourceId)}`, {
          method: "POST",
          auth: isAdminLoggedIn,
          body: comment,
        });
        await loadBackendState({ silent: true });
      } catch {
        return;
      }
    } else {
      const comments = getComments(resourceId);
      comments.unshift(comment);
      saveComments(resourceId, comments);
    }

    form.reset();
    renderAdminControls();
    renderDisease();
    refreshModalComments(resourceId, {
      open: true,
      notice: status === "pending"
        ? "Votre commentaire a bien été envoyé. Il apparaîtra après validation."
        : "",
    });
  } finally {
    stopSubmitLoading();
    stopLoading();
  }
}

async function approveComment(resourceId, commentId, control = null) {
  const stopLoading = startLoading("Validation du commentaire...");
  const stopControlLoading = setControlLoading(control, "Validation...");

  try {
    if (apiEnabled) {
      await apiRequest(
        `/api/comments/${encodeURIComponent(resourceId)}/${encodeURIComponent(commentId)}/approve`,
        {
          method: "POST",
          auth: true,
        },
      );
      await loadBackendState({ silent: true });
    } else {
      const comments = getComments(resourceId).map((comment) =>
        comment.id === commentId ? { ...comment, status: "approved" } : comment,
      );
      saveComments(resourceId, comments);
    }

    renderAdminControls();
    renderDisease();
    refreshModalComments(resourceId, { open: true });
  } finally {
    stopControlLoading();
    stopLoading();
  }
}

async function deleteComment(resourceId, commentId, control = null) {
  const stopLoading = startLoading("Suppression du commentaire...");
  const stopControlLoading = setControlLoading(control, "Suppression...");

  try {
    if (apiEnabled) {
      await apiRequest(
        `/api/comments/${encodeURIComponent(resourceId)}/${encodeURIComponent(commentId)}`,
        {
          method: "DELETE",
          auth: true,
        },
      );
      await loadBackendState({ silent: true });
    } else {
      const comments = removeCommentAndReplies(getComments(resourceId), commentId);
      saveComments(resourceId, comments);
    }

    renderAdminControls();
    renderDisease();
    refreshModalComments(resourceId, { open: true });
  } finally {
    stopControlLoading();
    stopLoading();
  }
}

function removeCommentAndReplies(comments, commentId) {
  const idsToRemove = new Set([commentId]);
  let changed = true;

  while (changed) {
    changed = false;
    comments.forEach((comment) => {
      if (comment.parentId && idsToRemove.has(comment.parentId) && !idsToRemove.has(comment.id)) {
        idsToRemove.add(comment.id);
        changed = true;
      }
    });
  }

  return comments.filter((comment) => !idsToRemove.has(comment.id));
}

function refreshModalComments(resourceId, options = {}) {
  if (!activeModal || activeModal.dataset.resourceId !== resourceId) {
    return;
  }

  const slot = activeModal.querySelector(".modal-comments-slot");
  slot.replaceChildren(createCommentArea(resourceId, options));
}

function getComments(resourceId) {
  if (apiEnabled) {
    return commentState[resourceId] ?? [];
  }

  const raw = localStorage.getItem(getStorageKey(resourceId));

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeStoredComment).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getInitialComments(resourceId) {
  const resource = resourcesById[resourceId];
  return (resource.importedComments ?? []).map((comment) => ({
    id: `initial-${comment.author}-${comment.message}`,
    author: comment.author,
    message: comment.message,
    createdAt: "",
    parentId: "",
    status: "approved",
    readonly: true,
  }));
}

function getAllCommentRecords(resourceId, options = {}) {
  const { includePending = false } = options;
  const comments = [...getComments(resourceId), ...getInitialComments(resourceId)];

  if (includePending) {
    return comments;
  }

  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  return comments.filter((comment) => comment.status === "approved" && hasApprovedCommentLineage(comment, byId));
}

function hasApprovedCommentLineage(comment, byId) {
  const visited = new Set();
  let parentId = comment.parentId;

  while (parentId) {
    if (visited.has(parentId)) {
      return false;
    }

    visited.add(parentId);
    const parent = byId.get(parentId);

    if (!parent || parent.status !== "approved") {
      return false;
    }

    parentId = parent.parentId;
  }

  return true;
}

function getCommentTree(resourceId, options = {}) {
  const records = getAllCommentRecords(resourceId, options).map((comment) => ({
    ...comment,
    children: [],
  }));
  const byId = new Map(records.map((comment) => [comment.id, comment]));
  const roots = [];

  records.forEach((comment) => {
    const parent = comment.parentId ? byId.get(comment.parentId) : null;

    if (parent) {
      parent.children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

function getApprovedCommentCount(resourceId) {
  return getAllCommentRecords(resourceId, { includePending: false }).length;
}

function getPendingCommentCount(resourceId) {
  return getComments(resourceId).filter((comment) => comment.status === "pending").length;
}

function getTotalPendingCommentCount() {
  return resources.reduce((total, resource) => total + getPendingCommentCount(resource.id), 0);
}

function normalizeStoredComment(comment) {
  if (!comment || typeof comment !== "object" || !comment.message) {
    return null;
  }

  return {
    id: comment.id || createCommentId(),
    author: String(comment.author ?? "").trim() || "Anonyme",
    message: String(comment.message ?? "").trim(),
    createdAt: comment.createdAt || "",
    parentId: comment.parentId || "",
    status: comment.status === "pending" ? "pending" : "approved",
  };
}

function saveComments(resourceId, comments) {
  if (apiEnabled) {
    commentState[resourceId] = comments;
    return;
  }

  localStorage.setItem(getStorageKey(resourceId), JSON.stringify(comments));
}

function getStorageKey(resourceId) {
  return `${storagePrefix}:${resourceId}`;
}

function createCommentId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function isImageResource(attachment) {
  return Boolean(attachment?.kind?.startsWith("image/") && attachment.url);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
