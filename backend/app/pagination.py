def paginate_collection(items, page=None, per_page=None, max_per_page=100):
    collection = list(items)
    total = len(collection)
    enabled = page is not None or per_page is not None

    resolved_page = max(page or 1, 1)
    resolved_per_page = per_page or 10
    resolved_per_page = min(max(resolved_per_page, 1), max_per_page)

    if enabled:
        start = (resolved_page - 1) * resolved_per_page
        end = start + resolved_per_page
        paginated_items = collection[start:end]
        pages = max((total + resolved_per_page - 1) // resolved_per_page, 1)
    else:
      paginated_items = collection
      resolved_per_page = total or resolved_per_page
      pages = 1

    return {
        "items": paginated_items,
        "pagination": {
            "enabled": enabled,
            "page": resolved_page,
            "per_page": resolved_per_page,
            "total": total,
            "pages": pages,
            "has_next": enabled and resolved_page < pages,
            "has_prev": enabled and resolved_page > 1,
        },
    }
