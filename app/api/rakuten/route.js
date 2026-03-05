import { NextResponse } from "next/server";

const RAKUTEN_API =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  const accessKey = searchParams.get("accessKey");
  const itemCode = searchParams.get("itemCode");
  const keyword = searchParams.get("keyword");
  const shopCode = searchParams.get("shopCode");

  if (!appId) {
    return NextResponse.json({ error: "appId is required" }, { status: 400 });
  }

  if (!itemCode && !keyword) {
    return NextResponse.json(
      { error: "itemCode or keyword is required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    applicationId: appId,
    format: "json",
    formatVersion: "2",
    hits: "3",
  });

  // accessKey is required for the new 2026 API domain
  if (accessKey) {
    params.set("accessKey", accessKey);
  }

  if (itemCode) {
    params.set("itemCode", itemCode);
  } else {
    if (shopCode) params.set("shopCode", shopCode);
    params.set("keyword", keyword);
  }

  // The new Rakuten API requires Origin and Referer headers
  // matching the registered "Allowed websites" domain
  const origin = searchParams.get("origin") || "https://price-simulator-flame.vercel.app";

  try {
    const res = await fetch(`${RAKUTEN_API}?${params.toString()}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        Origin: origin,
        Referer: `${origin}/`,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Rakuten API error:", res.status, text);
      return NextResponse.json(
        { error: `Rakuten API error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch from Rakuten API", detail: err.message },
      { status: 500 }
    );
  }
}
