import { prisma } from '../src/lib/prisma';

const CANTEEN_BANNERS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA9O0X2Eh8UOrZooEZ3B2x24a6rWYOFTlMPrR37YWMZpn8LMBWo1bzWA-aODFrP2maFLVoMbg6EhUVscXgsFl61klQYZR--Gd9amGbqw6-Ttag1IrszA07kI1rfvGH5vDdyAn0xLwwlTLAWch6DveNXBAh4vZKfk5GNKA_eUZguy0Oki61JnwByJCdB5YTBfj4kZ54KPkqCWye2ptMsNx-R9yDVBoFPJmbWD7iThqgd',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB0bUXF78S1ws_jUJBughKbpgJ1b-5QhyfFMsMebRVIONhAVe35uAi4qqSZZXlp7HUTuZ3ayvdveGBanMfmr3K0pNWcMKpiIQLPkSwO11nS4lvREgiVopy2rFuN93UEXO9NLIY5Qk3ZaYFZs1bhLr6WsVtlHX0bN3kf-JrzlJRodF3L0-l8mN07YIBWAcXU3hWPJ0AOQUK6yP1TQCVonfcEnOVmm88bR85eUGdjRhUm',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC8dCQO_-Vb6euOidpxiAunaZ67Ny4tjqfO64VdXhy5LwSfFpqNscXcdM5qBLXUCHJIGrUrYHo2_uJKnfLbX3va17HCvbT-ZAU4fKNVkSZz2UPEqydpp1p-1eHe5Gr-RQzPqAAmroquhPRhOi7xIZspDLxyMYJKY_BWZZajFRlKLCuQHF2HE9qF4EiB87_FX-pa0Yh5PaJMZ4a_--WN5N7hUT72IwHm-B1WxDsOvg5e',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAOPHk-2S8OdUuyk_BR3XqGL-ni6riqdvcFYPsw7zyCOA6ZBms-LZnuNJdA6wU39Uke0d8vTNdlCM9i5v-X80_i2RkdV0HnupRzdpSGr6zmfRmfp80zNn2nBOQd4iBL03ShB915LfSx4K8ndXlFOH1gnNgnQz9soNfDFyLaalKUedQy5I0d5wHnW7kbS_seFyBTKolv2KPLmNyvrTu3jy-8CzXmUy2ERRCSlLlr1uk6',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBvSK5OV-dv5wHItWrElb7GJJkGBBSNth0qppsVqV6YXwsueyxBJUUDNhReZY54WtMrU121wS_20hnA7fcbLY1zbWBNAPz0GxW3kNZGEiXh_jLcI_cysrZF_SvXoq9JFS9MTaXfxqQspp54ce28VjdUupOkP0mK6y8FY58ttQTcg1e7AeeQvBEdjZeh5b3oHnLxU2Dip6g-_Om9YGJ05s_06hkEbDh5fb-G5PihGoee',
];

const MENU_PHOTO_MAP: Record<string, string> = {
  'Ayam Geprek': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb',
  'Nasi Goreng Spesial': 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0bUXF78S1ws_jUJBughKbpgJ1b-5QhyfFMsMebRVIONhAVe35uAi4qqSZZXlp7HUTuZ3ayvdveGBanMfmr3K0pNWcMKpiIQLPkSwO11nS4lvREgiVopy2rFuN93UEXO9NLIY5Qk3ZaYFZs1bhLr6WsVtlHX0bN3kf-JrzlJRodF3L0-l8mN07YIBWAcXU3hWPJ0AOQUK6yP1TQCVonfcEnOVmm88bR85eUGdjRhUm',
  'Mie Ayam': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8dCQO_-Vb6euOidpxiAunaZ67Ny4tjqfO64VdXhy5LwSfFpqNscXcdM5qBLXUCHJIGrUrYHo2_uJKnfLbX3va17HCvbT-ZAU4fKNVkSZz2UPEqydpp1p-1eHe5Gr-RQzPqAAmroquhPRhOi7xIZspDLxyMYJKY_BWZZajFRlKLCuQHF2HE9qF4EiB87_FX-pa0Yh5PaJMZ4a_--WN5N7hUT72IwHm-B1WxDsOvg5e',
  'Soto Ayam': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOPHk-2S8OdUuyk_BR3XqGL-ni6riqdvcFYPsw7zyCOA6ZBms-LZnuNJdA6wU39Uke0d8vTNdlCM9i5v-X80_i2RkdV0HnupRzdpSGr6zmfRmfp80zNn2nBOQd4iBL03ShB915LfSx4K8ndXlFOH1gnNgnQz9soNfDFyLaalKUedQy5I0d5wHnW7kbS_seFyBTKolv2KPLmNyvrTu3jy-8CzXmUy2ERRCSlLlr1uk6',
  'Nasi Ayam Bakar': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvSK5OV-dv5wHItWrElb7GJJkGBBSNth0qppsVqV6YXwsueyxBJUUDNhReZY54WtMrU121wS_20hnA7fcbLY1zbWBNAPz0GxW3kNZGEiXh_jLcI_cysrZF_SvXoq9JFS9MTaXfxqQspp54ce28VjdUupOkP0mK6y8FY58ttQTcg1e7AeeQvBEdjZeh5b3oHnLxU2Dip6g-_Om9YGJ05s_06hkEbDh5fb-G5PihGoee',
  'Es Teh Manis': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE3roTy4e-Ia2y-1-RBpFR9bMGp6wnGQ_VBGC87apMJwkKQMjcqIUlRqjWCZF-OV5C7-4aj2aIvNPLWGwDBa2sh1mAq-XgLESAlc7hogRfvH19UHK6fKo3pOLFCTHmyWqf9syNZcBWc4EHyPD8TAqFSD7lMyXnvElmWOKfwWbbwG_miX21SPPJp4ciqRfwjSXrObkVM8vncvrTPnglr6RPnQKtUy1h5VbxW4w_naTg',
  'Es Jeruk': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIuKw_e6kY-9n9emR6pzQV9VHzx5M1dCXWv6MQ9LtydFANXAq4IgWUEppOXRwJzpp49uA4Roua8Qpqed6LGuqX7wAmVFo_oHZDMYJFBGpFJMiE2vXGDSmqDPO-OLLlz86V_V3U9uoydgbFChv1liqI0atNk1TVVt78iMkLSB-nv79wNulUsUdzWfWRZeiAHhgUUgvCjsHSiX5VCXpzgRo3ChmjZATqYGdBRucCUloO',
  'Kopi Susu': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWKW2FeqTs8MpQdwmXPloIxbCBkEthPwiKn291qApavQ0IaNim6xEWh_bmmGp9RnhSdZ2WzMntPZohk73M1wzydKppHi7W2iRXKbfAzzCCQkUSt7kNqDJB4uH_iWv32CPr3IIHLd6kaHb-L0OJxAz6ppxV7pEEuShQ4V2T-sNYL8wWgEHjmFarrHNhmdEyVjucZRriT9J9dY46fNJx1VNxsufTLqRugYTJ193ylgmY',
  'Pisang Goreng': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD-A-r10q-wEpuP4Hh_4nTQbValSaxtG7wVQY8HXjX1DXkQ7IMxllH0glCPClnw2GRus8bu8c1ik9WSpu-CVMlokdrodkLV-E-AvByMFd4oALb9-FLO1mf2ZiC3DJuHh76CA8U_ZT6LwAuN00_t9gndfNZLp3y8D7NXDxUPWdTDjay04IYzL_mmCNV_ANcKd5ECvfsKCOG48ROin1BF67QBWGpNGAXNNQNVyEhiCBl',
  'Cireng Isi': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA66v-quCa9N-cZvTjh3UB3cHPq9v8KzMm-Ez4OWaf6XU4QUNsDYbwx5tMsI_7pL8RzMNidl9kCs4MKLn2KsA4ne6joRmjh3cyQn7szsMUldODMjRkeMPM3XCdOq_PKCD7iEYe8IAIr-g2EhassJGp_6PTOFhH1XWktixTjilzLaSIyPLaAAwRJRtWaY9yp7obFxIq-7As3S8VF05XMzM6BQm-n4Ow8qRfidVYGmaKv',
};

const DEFAULT_FOOD_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDONUCpglL6jc-58eEFB9jmnxQIbojv28_kmIw_3_cOique7XHmwaWM2_GidCmfRafjTuZJaorhpiVxsItRpSbieUWQT8jR0crmX2VGi-m2rj1-150lHILHHQBL8twqncJOSKjfIhXCKvgpqHIvzCvs6sutxYWCrwTJ2_LKQlZFkQJokJfZVsJJX0fM0GO-EHibCrRrHOrqJVecR6roeobFxvqyhFeJWm4-LDX1oyFb';
const DEFAULT_DRINK_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDE3roTy4e-Ia2y-1-RBpFR9bMGp6wnGQ_VBGC87apMJwkKQMjcqIUlRqjWCZF-OV5C7-4aj2aIvNPLWGwDBa2sh1mAq-XgLESAlc7hogRfvH19UHK6fKo3pOLFCTHmyWqf9syNZcBWc4EHyPD8TAqFSD7lMyXnvElmWOKfwWbbwG_miX21SPPJp4ciqRfwjSXrObkVM8vncvrTPnglr6RPnQKtUy1h5VbxW4w_naTg';
const DEFAULT_SNACK_PHOTO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCD-A-r10q-wEpuP4Hh_4nTQbValSaxtG7wVQY8HXjX1DXkQ7IMxllH0glCPClnw2GRus8bu8c1ik9WSpu-CVMlokdrodkLV-E-AvByMFd4oALb9-FLO1mf2ZiC3DJuHh76CA8U_ZT6LwAuN00_t9gndfNZLp3y8D7NXDxUPWdTDjay04IYzL_mmCNV_ANcKd5ECvfsKCOG48ROin1BF67QBWGpNGAXNNQNVyEhiCBl';

async function main() {
  console.log('--- SEEDING APPETIZING FOOD & CANTEEN IMAGES ---');

  // 1. Update Canteens
  const canteens = await prisma.canteen.findMany();
  for (let i = 0; i < canteens.length; i++) {
    const c = canteens[i];
    const banner = CANTEEN_BANNERS[i % CANTEEN_BANNERS.length];
    await prisma.canteen.update({
      where: { id: c.id },
      data: { banner_url: banner },
    });
    console.log(`Updated Canteen [${c.name}] with banner`);
  }

  // 2. Update Menu Items
  const menus = await prisma.menuItem.findMany();
  for (const m of menus) {
    let photo = MENU_PHOTO_MAP[m.name];
    if (!photo) {
      if (m.category === 'Minuman') photo = DEFAULT_DRINK_PHOTO;
      else if (m.category === 'Camilan') photo = DEFAULT_SNACK_PHOTO;
      else photo = DEFAULT_FOOD_PHOTO;
    }
    await prisma.menuItem.update({
      where: { id: m.id },
      data: { photo_url: photo },
    });
    console.log(`Updated Menu [${m.name}] with photo`);
  }

  console.log('--- ALL IMAGES SUCCESSFULLY POPULATED! ---');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
