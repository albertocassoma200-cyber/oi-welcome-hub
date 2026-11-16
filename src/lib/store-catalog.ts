import bodySpray from "@/assets/catalog/body-spray-catalog.jpg.asset.json";
import purseMirror from "@/assets/catalog/purse-mirror-catalog.jpg.asset.json";
import carrotSoap from "@/assets/catalog/carrot-soap-catalog.jpg.asset.json";
import thermalCup from "@/assets/catalog/thermal-cup-catalog.jpg.asset.json";
import makeupSet from "@/assets/catalog/makeup-set-catalog.jpg.asset.json";
import skincareDevice from "@/assets/catalog/skincare-device-catalog.jpg.asset.json";
import pimplePatches from "@/assets/catalog/pimple-patches-catalog.jpg.asset.json";
import turmericSoap from "@/assets/catalog/turmeric-soap-catalog.jpg.asset.json";
import makeupBag from "@/assets/catalog/makeup-bag-catalog.jpg.asset.json";

export const catalogDetails = [
  { id: 1, name: "Body spray", category: "Beleza & cosméticos", price: 3500, image: bodySpray.url, tag: "Fragrância" },
  { id: 2, name: "Espelho para bolsa", category: "Bolsas & acessórios", price: 1500, image: purseMirror.url, tag: "Acessório" },
  { id: 3, name: "Sabonete de cenoura", category: "Cuidados pessoais", price: 2500, image: carrotSoap.url, tag: "Autocuidado" },
  { id: 4, name: "Copo térmico", category: "Presentes & lifestyle", price: 6500, image: thermalCup.url, tag: "Favorito" },
  { id: 5, name: "Conjunto 2 em 1: primer e removedor de maquilhagem", category: "Beleza & cosméticos", price: 2000, image: makeupSet.url, tag: "2 em 1" },
  { id: 6, name: "Máquina de skin care", category: "Cuidados pessoais", price: 3500, image: skincareDevice.url, tag: "Cuidados de pele" },
  { id: 7, name: "Adesivos para espinhas", category: "Cuidados pessoais", price: 1500, image: pimplePatches.url, tag: "Cuidados de pele" },
  { id: 8, name: "Sabão de açafrão", category: "Cuidados pessoais", price: 2800, image: turmericSoap.url, tag: "Autocuidado" },
  { id: 9, name: "Nécessaire", category: "Bolsas & acessórios", price: 2500, image: makeupBag.url, tag: "Acessório" },
];

export const formatCatalogPrice = (amount: number) =>
  `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Kz`;