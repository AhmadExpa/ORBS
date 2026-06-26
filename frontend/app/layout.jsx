import "./globals.css";
import Script from "next/script";
import { Providers } from "@/components/shared/providers";

export const metadata = {
  title: "ElevenOrbits",
  description: "Managed hosting, AI, workflow automation, and support services.",
  icons: {
    icon: "/invoice.png",
    shortcut: "/invoice.png",
    apple: "/invoice.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script
          id="strip-extension-hydration-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var attributeName = "bis_skin_checked";

                function removeAttribute(node) {
                  if (!node || node.nodeType !== 1 || !node.hasAttribute) return;

                  if (node.hasAttribute(attributeName)) {
                    node.removeAttribute(attributeName);
                  }
                }

                function stripTree(root) {
                  removeAttribute(root);

                  if (root.querySelectorAll) {
                    root.querySelectorAll("[" + attributeName + "]").forEach(function (node) {
                      node.removeAttribute(attributeName);
                    });
                  }
                }

                stripTree(document.documentElement);

                if (window.MutationObserver) {
                  new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                      removeAttribute(mutation.target);
                    });
                  }).observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: [attributeName]
                  });
                }
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
