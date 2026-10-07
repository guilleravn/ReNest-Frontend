import { createCn } from "cn/config"

/**
 * Class-name merger aware of the custom theme in index.css, so e.g.
 * `text-button` (font size) does not override `text-text-inverse` (color).
 * Keep in sync when adding new --text-* or --tracking-* theme tokens.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["button", "label", "badge", "count"] }],
      tracking: [{ tracking: ["overline"] }],
    },
  },
})
