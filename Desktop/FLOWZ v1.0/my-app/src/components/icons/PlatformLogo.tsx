import { ShopifyIcon } from "./ShopifyIcon";
import { WooCommerceIcon } from "./WooCommerceIcon";

export type PlatformType = "shopify" | "woocommerce";

type PlatformLogoProps = {
    platform: PlatformType;
    size?: number;
    className?: string;
};

export const PlatformLogo = ({ platform, size = 28, className }: PlatformLogoProps) => {
    if (platform === "shopify") {
        return <ShopifyIcon size={size} className={className} />;
    }

    return <WooCommerceIcon size={size} className={className} />;
};
