import { NextResponse } from "next/server";

const RAKUTEN_API = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  const shopCode = searchParams.get("shopCode");
  const keyword = searchParams.get("keyword");
  const itemCode = searchParams.get("itemCode");

  if (!appId) {
    return NextResponse.json({ error: "appId is required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    applicationId: appId,
    format: "json",
    formatVersion: "2",
    hits: "3",
  });

  // itemCode search is most accurate
  if (itemCode) {
    params.set("itemCode", itemCode);
  } else if (shopCode && keyword) {
    params.set("shopCode", shopCode);
    params.set("keyword", keyword);
  } else if (keyword) {
    params.set("keyword", keyword);
  } else {
    return NextResponse.json({ error: "keyword or itemCode is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${RAKUTEN_API}?${params.toString()}`, {
      headers: { "User-Agent": "PriceSimulator/1.0" },
      next: { revalidate: 300 }, // cache for 5 min
    });

    if (!res.ok) {
      const text = await res.text();
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
