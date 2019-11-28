/** @jsx jsx */
import { jsx } from "@emotion/core"
import React from "react"
import { graphql } from "gatsby"
import SplatCharmPageLayout from "../components/SplatCharmPageLayout"

const SplatCharmPageProvider: React.FC<any> = ({ data, pageContext }) => {
  return <SplatCharmPageLayout data={data as any} pageContext={pageContext} />
}

export default SplatCharmPageProvider

export const query = graphql`
  query SplatCharmPageProvider(
    $names: [String]
    $charmSource: String
    $requires: [String]
    $id: String
  ) {
    charm: exaltedCharm(id: { eq: $id }) {
      name
      charmSource
      essence
      type
      cost
      duration
      rating
      trait
      splat
      tags

      requires

      mdx: parent {
        ... on Mdx {
          body
        }
        file: parent {
          ... on File {
            ...GithubEditLinkFileData
          }
        }
      }
    }

    requiredForInSplat: allExaltedCharm(
      sort: { fields: [essence, rating, name], order: ASC }
      filter: { requires: { in: $names }, charmSource: { eq: $charmSource } }
    ) {
      group(field: trait) {
        fieldValue
        totalCount
        charms: nodes {
          url
          name
          essence
          trait
          rating
        }
      }
    }

    requires: allCharmlike(filter: { friendlyNames: { in: $requires } }) {
      found: distinct(field: name)
      charms: nodes {
        charmSource
        url
        friendlyNames
        name
      }
    }
  }
`
