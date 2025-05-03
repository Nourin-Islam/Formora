const features = [
  {
    title: "Core Functional Requirements",
    items: [
      {
        section: "Authentication & Roles",
        items: [
          { task: "Users can register and log in via site forms", completed: true },
          { task: "Unauthenticated users can search", completed: true },
          { task: "Unauthenticated users can view templates in read-only mode", completed: true },
          { task: "Unauthenticated users cannot create templates, leave comments, like, or fill forms", completed: true },
          { task: "Admins can view, block/unblock, delete users", completed: true },
          { task: "Admins can promote/demote admins (including themselves)", completed: true },
          { task: "Admins can manage any template/form as if they were the owner", completed: true },
        ],
      },
      {
        section: "Template System",
        items: [
          { task: "Authenticated users can create templates with title, description (Markdown supported), topic, image, and tags", completed: true },
          { task: "Users can add/edit/delete questions (with drag-and-drop reordering)", completed: true },

          { task: "Users can set access level: public or restricted to specific users (with autocomplete for names/emails)", completed: true },
          { task: "Supports n number of single-line string questions", completed: true },
          { task: "Supports n number of multi-line text questions", completed: true },
          { task: "Supports n number of positive integer questions", completed: true },
          { task: "Supports n number of checkbox questions", completed: true },
          { task: "Each question has: title, description, and 'show in table' flag", completed: true },
          { task: "Fixed fields auto-filled: user and date", completed: true },
          { task: "Autocompletion for tags from DB", completed: true },
          { task: "Image uploads are done via cloud (not hosted on your server)", completed: true },
        ],
      },
      {
        section: "Form System",
        items: [
          { task: "Authenticated users can fill out forms if allowed by template access", completed: false },
          { task: "Users can view their own filled forms", completed: true },
          { task: "Template creator (or admin) can view all filled forms for their templates", completed: false },
          { task: "Template creator (or admin) can view/edit any user’s form answers", completed: false },
          { task: "Editable answers are available to form owner and admins", completed: false },
        ],
      },
      {
        section: "Template Page Tabs",
        items: [
          { task: "General Settings (title, description, image, tags, access)", completed: false },
          { task: `"Questions editor", "Results (list of filled forms with links)`, completed: false },
          { task: "Aggregation (e.g., avg for numbers, mode for strings)", completed: false },
        ],
      },
      {
        section: "User Interface",
        items: [
          { task: "No 'N+1' button layouts – uses toolbars, hover/contextual menus, etc.", completed: false },
          { task: "Main page contains gallery of latest templates (with name, desc/image, author)", completed: false },
          { task: "Top 5 templates by number of filled forms", completed: false },
          { task: "Tag cloud (clicking a tag links to filtered search results)", completed: false },
          { task: "Comments on templates (linear, append-only, auto-updated every 2-5 seconds)", completed: false },
          { task: "Likes on templates (1 per user)", completed: false },
          { task: "Full-text search (uses DB or external engine, no full-table scans)", completed: false },
          { task: "Header has full-text search on every page", completed: false },
        ],
      },
      {
        section: "User Pages",
        items: [
          { task: "Personal page with sortable table of own templates (create/edit/delete)", completed: false },
          { task: "Personal page with sortable table of own forms (view/edit/delete)", completed: false },

          { task: "Two-tab layout", completed: false },
        ],
      },
      {
        section: "🌐 Internationalization & Theming",
        items: [
          { task: "Supports two UI languages (English + one other)", completed: false },
          { task: "Only UI is translated (not user content)", completed: false },
          { task: "Supports dark and light themes", completed: false },
          { task: "User choice of theme and language is saved", completed: false },
          { task: "Fully responsive (mobile support included)", completed: false },
        ],
      },
      {
        section: "🧠 Performance & Architecture",
        items: [
          { task: "Uses PostgreSQL or another relational DB", completed: false },
          { task: "Avoids full DB scans and loops with queries", completed: false },
          { task: "Images are not uploaded to web server", completed: false },
          { task: "No DB queries in loops", completed: false },
          { task: "Full-text search is implemented correctly (e.g., tsvector, pg_trgm, etc. if using PostgreSQL)", completed: false },
        ],
      },
      {
        section: "✨ Optional Features (Extra Credit)",
        items: [
          { task: "Social login (OAuth via Google, GitHub, etc.)", completed: true },
          { task: "'One-from-list' question type with custom options (e.g., dropdowns)", completed: false },
          { task: "Unlimited number of questions per type", completed: false },
          { task: "'Email me a copy' checkbox for form submitter", completed: true },
        ],
      },
    ],
  },
];

export default function FeatureList() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {features.map((category, i) => (
        <div key={i} className="mb-8">
          <h1 className="text-2xl font-bold mb-4">{category.title}</h1>
          {category.items.map((section, j) => (
            <div key={j} className="mb-4">
              <h2 className="text-xl font-semibold mb-2">{section.section}</h2>
              <ul className="  list-inside space-y-1">
                {section.items.map((item, k) => (
                  <li key={k} className="text-gray-800">
                    <input type="checkbox" checked={item.completed} name="" id="" /> {item.task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
