"use client";

import { useEffect } from "react";

// โหลด Facebook JS SDK แบบ lazy (ครั้งเดียวต่อหน้า) แล้วสั่ง parse ปุ่ม/โพสต์ fb-post ที่ฝังไว้
// ใช้ SDK แทน iframe ตรงๆ เพราะ SDK จะปรับความสูงให้พอดีเนื้อหาโพสต์เองอัตโนมัติ
export function FacebookEmbed({ url }: { url: string }) {
  useEffect(() => {
    const win = window as typeof window & {
      FB?: { XFBML: { parse: () => void } };
    };

    if (win.FB) {
      win.FB.XFBML.parse();
      return;
    }

    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }

    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/th_TH/sdk.js#xfbml=1&version=v19.0";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, [url]);

  return (
    <div className="fb-post" data-href={url} data-width="552" data-show-text="true" />
  );
}
