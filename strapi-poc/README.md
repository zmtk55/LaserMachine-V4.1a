# Strapi POC - Templates de Diseño

## Esquema de Collections

### 1. `template` (Collection Type)

```javascript
// src/api/template/content-types/template/schema.json
{
  "kind": "collectionType",
  "collectionName": "templates",
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "occasion": {
      "type": "enumeration",
      "enum": [
        "fathers-day",
        "mothers-day", 
        "teachers-day",
        "birthday",
        "graduation",
        "valentine",
        "christmas",
        "general"
      ],
      "default": "general"
    },
    "texts": {
      "type": "component",
      "component": "design.text-element",
      "repeatable": true,
      "min": 1,
      "max": 3
    },
    "previewImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "tags": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::tag.tag"
    },
    "isActive": {
      "type": "boolean",
      "default": true
    },
    "isFavorite": {
      "type": "boolean", 
      "default": false
    },
    "usageCount": {
      "type": "integer",
      "default": 0
    },
    "collection": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::collection.collection"
    }
  }
}
```

### 2. Componente `design.text-element`

```javascript
// src/components/design/text-element.json
{
  "collectionName": "components_design_text_elements",
  "attributes": {
    "content": {
      "type": "string",
      "required": true
    },
    "fontFamily": {
      "type": "string",
      "default": "Bebas Neue"
    },
    "size": {
      "type": "decimal",
      "default": 1.0,
      "min": 0.5,
      "max": 3.0
    },
    "yPosition": {
      "type": "integer",
      "default": 50,
      "min": 10,
      "max": 90
    },
    "rotation": {
      "type": "integer",
      "default": 0,
      "min": -180,
      "max": 180
    }
  }
}
```

### 3. `tag` (Collection Type)

```javascript
{
  "kind": "collectionType",
  "collectionName": "tags",
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "templates": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "api::template.template",
      "mappedBy": "tags"
    }
  }
}
```

### 4. `collection` (Collection Type - carpetas)

```javascript
{
  "kind": "collectionType",
  "collectionName": "collections",
  "attributes": {
    "name": {
      "type": "string",
      "required": true
    },
    "icon": {
      "type": "string"
    },
    "templates": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::template.template",
      "mappedBy": "collection"
    }
  }
}
```

## API Endpoints

### GET - Listar templates con filtros
```bash
# Por ocasión
GET /api/templates?filters[occasion][$eq]=fathers-day&populate=*

# Solo activos, ordenados por uso
GET /api/templates?filters[isActive][$eq]=true&sort[0]=usageCount:desc&populate=*

# Buscar por nombre (búsqueda parcial)
GET /api/templates?filters[name][$containsi]=rey&populate=*

# Favoritos
GET /api/templates?filters[isFavorite][$eq]=true&populate=*
```

### POST - Crear template
```bash
POST /api/templates
Content-Type: application/json

{
  "data": {
    "name": "El Rey",
    "occasion": "fathers-day",
    "texts": [
      {
        "content": "REY",
        "fontFamily": "Bebas Neue",
        "size": 1.5,
        "yPosition": 35
      },
      {
        "content": "PAPÁ",
        "fontFamily": "Plus Jakarta Sans", 
        "size": 1.0,
        "yPosition": 65
      }
    ],
    "isActive": true,
    "tags": [1, 2]  // IDs de tags existentes
  }
}
```

### PUT - Incrementar uso
```bash
PUT /api/templates/123
{
  "data": {
    "usageCount": 246
  }
}
```

## GraphQL Queries

### Query con filtros complejos
```graphql
query SearchTemplates($occasion: String, $search: String) {
  templates(
    filters: {
      occasion: { eq: $occasion }
      name: { containsi: $search }
      isActive: { eq: true }
    }
    sort: ["usageCount:desc", "name:asc"]
    pagination: { page: 1, pageSize: 20 }
  ) {
    data {
      id
      attributes {
        name
        occasion
        usageCount
        texts {
          content
          fontFamily
          size
          yPosition
          rotation
        }
        previewImage {
          data {
            attributes {
              url
              formats
            }
          }
        }
        tags {
          data {
            id
            attributes {
              name
            }
          }
        }
        collection {
          data {
            attributes {
              name
            }
          }
        }
      }
    }
    meta {
      pagination {
        page
        pageSize
        total
      }
    }
  }
}
```

### Mutation - Toggle favorito
```graphql
mutation UpdateTemplate($id: ID!, $isFavorite: Boolean!) {
  updateTemplate(id: $id, data: { isFavorite: $isFavorite }) {
    data {
      id
      attributes {
        isFavorite
      }
    }
  }
}
```
