import { appPath } from '@/utils/appPath';

const icon = (size) => ({
    src: appPath(`/icons/icon-${size}.png`),
    sizes: `${size}x${size}`,
    type: 'image/png',
});

export default function manifest() {
    return {
        name: 'Vinerys - Pivnita Digitala',
        short_name: 'Vinerys',
        description: 'Gestioneaza-ti colectia de vinuri cu eleganta',
        start_url: appPath('/dashboard'),
        scope: appPath('/'),
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0d0608',
        theme_color: '#8b1a2e',
        lang: 'ro',
        categories: ['food', 'lifestyle'],
        icons: [72, 96, 128, 144, 152, 192, 384, 512].map(icon),
        shortcuts: [
            { name: 'Adauga vin', short_name: 'Adauga', url: appPath('/wines/add'), icons: [icon(96)] },
            { name: 'Colectia mea', short_name: 'Colectie', url: appPath('/wines'), icons: [icon(96)] },
        ],
    };
}