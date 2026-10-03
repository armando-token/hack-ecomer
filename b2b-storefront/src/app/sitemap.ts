import { listAllCatalogProducts } from "@lib/catalog/catalog-source"
import { catalogRevalidateOptions, CATALOG_CACHE_TAGS } from "@lib/catalog/catalog-cache"
import { company } from "@lib/config/company"
import {
  flattenCategoryTree,
  getCatalogCategoryTree,
} from "@lib/catalog/catalog-category-tree"
import { CASE_STUDIES } from "@lib/data/case-studies"
import { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `${company.siteUrl}/pe`

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contacto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/casos-de-exito`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  const casePages: MetadataRoute.Sitemap = CASE_STUDIES.map((c) => ({
    url: `${baseUrl}/casos-de-exito/${c.slug}`,
    lastModified: new Date(c.date || Date.now()),
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  let categoryPages: MetadataRoute.Sitemap = []
  try {
    const categoryTree = await getCatalogCategoryTree("pe")
    categoryPages = flattenCategoryTree(categoryTree).map(({ path }) => ({
      url: `${baseUrl}/store/${path.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: path.length > 1 ? 0.7 : 0.8,
    }))
  } catch {
    // Backend offline during build; sitemap revalidates every 3600s
  }

  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await listAllCatalogProducts("pe")
    productPages = products.map((p) => ({
      url: `${baseUrl}/products/${p.handle}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly",
      priority: 0.9,
    }))
  } catch {
    // Backend offline during build; sitemap revalidates every 3600s
  }

  return [...staticPages, ...casePages, ...categoryPages, ...productPages]
}

export const revalidate = 3600
