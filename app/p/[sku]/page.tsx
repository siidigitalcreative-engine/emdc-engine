REPLACE the existing useEffect that starts with:

  useEffect(() => {
    let cancelled = false;

    async function load() {

and ends immediately before:

  const legacyHub = useMemo(() => product?.productHub || {}, [product]);

WITH THIS:

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/product-hub?sku=${encodeURIComponent(
            params.sku
          )}&public=1`,
          {
            method: "GET",
            cache: "force-cache",
            signal: controller.signal,
          }
        );

        const payload =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !payload?.ok ||
          !payload?.found
        ) {
          if (!cancelled) {
            setProduct(null);
            setRelated([]);
            setBrand(null);
            setProductHubData(null);
            setDebugCount(
              Number(
                payload?.skuCount || 0
              )
            );
          }

          return;
        }

        if (!cancelled) {
          setProduct(
            payload.product || null
          );

          setRelated(
            Array.isArray(payload.related)
              ? payload.related
              : []
          );

          setBrand(
            payload.brand || null
          );

          setProductHubData(
            payload.productHubData || null
          );

          setDebugCount(
            Number(
              payload.skuCount || 0
            )
          );
        }
      } catch (error: any) {
        if (
          error?.name !== "AbortError"
        ) {
          console.error(
            "[EMDC] Public product page load failed:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [params.sku]);

IMPORTANT:
- Do not keep the old /api/emdc-state request.
- Do not keep the old /api/load request.
- Do not keep the old second /api/product-hub request.
- The public page must make only this one data request:
  /api/product-hub?sku=...&public=1
