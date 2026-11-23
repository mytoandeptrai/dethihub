module.exports = () => ({
  postcssPlugin: 'scope-editor-engine',
  OnceExit(root) {
    const file = root.source?.input.file?.replaceAll('\\', '/') ?? ''
    if (!file.endsWith('/styles/editor.css') && !file.endsWith('/styles/product.css')) return
    const rootScope = file.endsWith('/styles/product.css') ? 'html[data-product-shell]' : 'html[data-editor-engine]'
    const scope = `:where(${rootScope})`
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && rule.parent.name.endsWith('keyframes')) return
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'rule') return
      }
      rule.selectors = rule.selectors.map((selector) => {
        if (rootScope === 'html[data-product-shell]' && /^\.dark(?=[\s.:[#>+~]|$)/.test(selector)) return selector.replace(/^\.dark/, `${rootScope}.dark`)
        if (/^(?::root|:host|html)(?=[\s.:[#>+~]|$)/.test(selector)) return selector.replace(/^(?::root|:host|html)/, rootScope)
        return `${scope} ${selector}`
      })
    })
  },
})
