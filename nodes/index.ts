import { CreateNodeArgs, PluginOptions, CreatePagesArgs } from "gatsby"
import { FileNode } from "gatsby-theme-ludobrew-core/gatsbyNodeTools"
import path from "path"
import glob from "glob"

const asyncGlob = (pattern: string, options?: glob.IOptions) => {
  return new Promise<string[]>((resolve, reject) => {
    glob(pattern, options || {}, (err, matches) => {
      if (err) reject(err)
      resolve(matches)
    })
  })
}

const pagesGlob = path
  .resolve(path.join(__dirname, "**", "Pages.ts"))
  .replace(/\\/g, "/")

type HasMakePages = {
  makePages: typeof createNodePages
}

export const createNodePages = async (
  args: CreatePagesArgs,
  themeOptions?: PluginOptions,
) => {
  const pageMatches = await asyncGlob(pagesGlob)

  await Promise.all(
    pageMatches
      .map(require)
      .filter((fn) => fn.makePages)
      .map<HasMakePages>((fn) => fn.makePages(args, themeOptions)),
  )
}

import { handlesContent as artifactHandlers } from "./Artifact"
import { handlesContent as splatHandlers } from "./Charm/Charm"
import { Handler } from "./types"

const handlers = {
  ...artifactHandlers,
  ...splatHandlers,
} as Record<string, Handler<any>>

export const handleMDXNode = async (
  args: CreateNodeArgs<{ frontmatter?: { content?: string } }>,
  _?: PluginOptions,
) => {
  const { node, getNode, reporter } = args
  if (!node?.parent) {
    reporter.error("Node missing node.parent")
    return
  }
  const fileNode = (await getNode(node.parent)) as FileNode
  if (!node.frontmatter?.content) {
    reporter.warn(`${fileNode.relativePath} is missing the content field"`)
    return
  }

  const contentType = node.frontmatter.content.toLowerCase()
  if (contentType in handlers) {
    const { validator, handler } = handlers[contentType]
    let validResult = null
    try {
      validResult = await validator.validate(node.frontmatter)
    } catch (e) {
      //@ts-ignore
      reporter.error(
        `There are validation errors for ${fileNode.relativePath}:\n\t` +
          e.errors.join("\n\t"),
      )
    }
    const nodePerhaps = await handler({ result: validResult, args })
    return nodePerhaps
  }
}
