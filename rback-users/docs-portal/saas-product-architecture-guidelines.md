# Neos CMS: Multi-Tenant PIM Architecture Guidelines

## 1. Executive Summary

Neos CMS serves as a centralized **Product Information Management (PIM) System** for 19 highly diverse business concerns under the Akij Venture.

**Crucial Paradigm Shift:** The CMS is strictly responsible for _Product Definition_ (PIM). It does **not** handle physical store routing, outlet management, or real-time stock/inventory tracking.

The portfolio ranges from fast-moving consumer goods (FMCG) and electronics to highly complex non-physical products like **Life Insurance** and **Real Estate**. To support this massive variance without breaking the database, the architecture must strictly separate universal identity from concern-specific characteristics.

---

## 2. Portfolio Analysis (The 19 Concerns)

The system must handle products with vastly different shapes:

1.  **FMCG & Grocery** (Food, Dairy, Metro Mart): Simple SKUs, pack sizes, perishable flags (`strProductType: 'fresh'`).
2.  **Technical & Durable Goods** (Bicycles, Cars, Electronics): Extremely complex technical specifications, warranty tracking, and visual variants (color, size, model).
3.  **Publications** (Books): Relies on ISBNs, Authors, Publishers, and Formats (Hardcover vs Paperback).
4.  **Virtual & Service Products** (Insurance, Real Estate, Venture): No physical weight, no physical dimensions, no shipping. Pricing may be highly dynamic (e.g., Insurance premiums).

---

## 3. Core Architectural Principles for a Pure PIM

To maintain this architecture across all 19 concerns, development must adhere to the following rules:

### Rule 1: Purge/Ignore Inventory & Store Logic from the CMS

Since the CMS does not handle stock, any legacy columns in `tblProductsUnified` related to inventory (e.g., `intMinStock`, `intMaxStock`, `blnSale`, `blnIndent`) should be considered legacy for Store Sales integration, and **never** expanded upon in the CMS core.

- **Action:** The CMS must only concern itself with defining what the product _is_, not _where_ it is or _how many_ exist.

### Rule 2: Keep `tblProductsUnified` Strictly Universal

Never add industry-specific columns to the unified table.

- **Why:** If you add `strISBN` for books, `strVIN` for cars, and `intBedrooms` for Real Estate, the table will collapse under the weight of "sparse data" (columns that are `NULL` for 95% of your clients).
- **Solution:** `tblProductsUnified` must only contain fields applicable to **all** 19 concerns: ID, OrgID, Title, Slug, Base Price, Status, and Audit timestamps.

### Rule 3: Maximize the EAV (Spec-Attribute) System

The existing `tblProductSpecifications` (EAV) system is the **savior of this architecture**. It is the only way a single database can store a "Life Insurance Policy" and a "Mountain Bike" side-by-side.

- **Insurance:** Spec Group = "Coverage", Attributes = ["Term Length", "Payout Limit"]
- **Real Estate:** Spec Group = "Property Details", Attributes = ["Square Footage", "Facing Direction"]
- **Cars:** Spec Group = "Engine", Attributes = ["Horsepower", "Fuel Type"]

---

## 4. The Dynamic Variant System (PIM Focused)

Even without inventory, products still have variations (e.g., Books: Hardcover vs PDF. Cars: Red vs Blue. Bicycles: Size M vs L).

Because the CMS does not track stock, the variant system is streamlined. It uses a **Normalized Mapping** approach to avoid JSON columns and ensure future-proofing.

### 4.1. Database Schema (No Inventory)

**1. The Physical/Virtual Variant Unit**
This table defines the variant identity and price difference. Notice the absence of `intStockQty`.

```sql
CREATE TABLE tblProductVariants (
    intId INT PRIMARY KEY AUTO_INCREMENT,
    intParentProductId INT NOT NULL,  -- FK to tblProductsUnified
    intOrgId INT NOT NULL,
    strSKU VARCHAR(255),              -- Variant specific SKU (e.g., BOOK-HC)
    decPriceDelta DECIMAL(10,2),      -- Price difference (+50 for Hardcover)
    strVariantImageUuid VARCHAR(512), -- Optional: Variant specific image
    blnIsActive BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (intParentProductId) REFERENCES tblProductsUnified(intId)
);
```

**2. The Axes of Variation (Option Types)**
Defines what a product can vary by for a specific organization.

```sql
CREATE TABLE tblVariantOptionTypes (
    intId INT PRIMARY KEY AUTO_INCREMENT,
    intOrgId INT NOT NULL,
    strOptionName VARCHAR(100)        -- e.g., "Format" (Books), "Color" (Cars)
);
```

**3. The Option Values**
The available values for each axis.

```sql
CREATE TABLE tblVariantOptionValues (
    intId INT PRIMARY KEY AUTO_INCREMENT,
    intOptionTypeId INT NOT NULL,     -- FK to tblVariantOptionTypes
    strValue VARCHAR(100),            -- e.g., "Hardcover", "Matte Black"
    strMetaValue VARCHAR(50) NULL,    -- e.g., Hex codes for colors
    FOREIGN KEY (intOptionTypeId) REFERENCES tblVariantOptionTypes(intId)
);
```

**4. The Variant Mapping Table**
Links the variant to the options that describe it.

```sql
CREATE TABLE tblVariantOptionMapping (
    intId INT PRIMARY KEY AUTO_INCREMENT,
    intVariantId INT NOT NULL,        -- FK to tblProductVariants
    intOptionValueId INT NOT NULL,    -- FK to tblVariantOptionValues
    FOREIGN KEY (intVariantId) REFERENCES tblProductVariants(intId),
    FOREIGN KEY (intOptionValueId) REFERENCES tblVariantOptionValues(intId)
);
```

---

## 5. Architectural Summary & Next Steps

The Neos CMS `product-central` module is **highly capable** of supporting all 19 concerns, including Insurance and Real Estate, provided it strictly acts as a PIM.

**To ensure success:**

1.  **Do not add operational logistics** (assembly, shipping, stock) to the CMS database. Let the downstream ERP/Store systems handle that via the SKU.
2.  **Rely on the Spec-Attribute system** for 100% of industry-specific data (ISBNs, VINs, Policy Terms).
3.  **Implement the Dynamic Variant Schema** above to handle variations gracefully across all industries.
4.  **Prepare for a Search Engine:** With 19 concerns relying on dynamic EAV specs, backend SQL filtering will eventually bottleneck. Plan to sync this catalog to Elasticsearch/Meilisearch for frontend API consumption.
