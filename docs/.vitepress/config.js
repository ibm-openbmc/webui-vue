import { defineConfig } from "vitepress";

export default defineConfig({
    base: "/webui-vue/",
    smoothScroll: true,
    title: "OpenBMC Web UI Style Guide",
    description:
      "Guidance on code style and development for the OpenBMC browser-based UI",
    themeConfig: {
      nav: [
        {
          text: "Guide",
          link: "/guide/"
        },
        {
          text: "Customization",
          link: "/customization/"
        },
        {
          text: "Github",
          link: "https://github.com/openbmc/webui-vue"
        }
      ],
      sidebar: {
        "/guide/": [
          "",
          {
            text: "Coding Standards",
            items: [
              { text: "JavaScript and SASS", link: "/guide/coding-standards/" },
              { text: "Accessibility", link: "/guide/coding-standards/accessibility" }
            ]
          },
          {
            text: "Guidelines",
            items: [
                { text: "Colors", link: "/guide/guidelines/colors" },
                { text: "Internationalization", link: "/guide/guidelines/internationalization" },
                { text: "Motion", link: "/guide/guidelines/motion" },
                { text: "Typography", link: "/guide/guidelines/typography" }
            ]
          },
          {
            text: "Unit testing",
            items: [
               { text: "Unit testing", link: "/guide/unit-testing/",}
            ]
          },
          {
            text: "Components",
            items: [
               { text: "Alerts", link: "/guide/components/alerts/" },
               { text: "Buttons", link: "/guide/components/buttons/" },
               { text: "File upload", link: "/guide/components/file-upload/" },
               { text: "Info tooltip", link: "/guide/components/info-tooltip/" },
               { text: "Page section", link: "/guide/components/page-section/" },
               { text: "Page title", link: "/guide/components/page-title/" },
               { text: "Status icon", link: "/guide/components/status-icon/" },
               { text: "Table", link: "/guide/components/table/" },
               { text: "Toasts", link: "/guide/components/toasts/" },
            ]
          },
          {
            text: "Quick Start",
            items: [
                { text: "Forms", link: "/guide/quickstart/forms" },
                { text: "Page anatomy", link: "/guide/quickstart/page-anatomy" },
                { text: "Store anatomy", link: "/guide/quickstart/store-anatomy" },
            ]
          }
        ],
        "/customization/": [
            { text: "Theme", link: "/customization/theme" },
            { text: "Build", link: "/customization/build" }
  ]
      }
    }
  });