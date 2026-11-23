module.exports = () => ({
  postcssPlugin: 'scope-editor-engine',
  OnceExit(root) {
    if (!root.source?.input.file?.replaceAll('\\', '/').endsWith('/styles/editor.css')) return
    const rootScope = 'html[data-editor-engine]'
    const scope = `:where(${rootScope})`
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && rule.parent.name.endsWith('keyframes')) return
      for (let parent = rule.parent; parent; parent = parent.parent) {
        if (parent.type === 'rule') return
      }
      rule.selectors = rule.selectors.map((selector) => {
        if (/^(?::root|:host|html)(?=[\s.:[#>+~]|$)/.test(selector)) return selector.replace(/^(?::root|:host|html)/, rootScope)
        return `${scope} ${selector}`
      })
    })
  },
})
