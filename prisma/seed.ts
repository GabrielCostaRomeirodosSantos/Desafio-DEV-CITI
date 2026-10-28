   import { PrismaClient } from "@prisma/client";

   const prisma = new PrismaClient();

   async function main() {
     await prisma.planta.deleteMany();

     await prisma.planta.createMany({
       data: [
         {
           nome: "Costela-de-adão",
           especie: "Monstera deliciosa",
           preco: 8990,
           estoque: 12,
           luminosidade: "MEIA_SOMBRA",
           petFriendly: false,
           regaACadaDias: 7,
         },
         {
           nome: "Samambaia",
           especie: "Nephrolepis exaltata",
           preco: 4500,
           estoque: 0,
           luminosidade: "SOMBRA",
           petFriendly: true,
           regaACadaDias: 3,
         },
         {
           nome: "Jiboia",
           especie: "Epipremnum aureum",
           preco: 3200,
           estoque: 25,
           luminosidade: "MEIA_SOMBRA",
           petFriendly: false,
           regaACadaDias: 5,
         },
         {
           nome: "Cacto-bola",
           especie: "Echinopsis calochlora",
           preco: 2500,
           estoque: 8,
           luminosidade: "SOL_PLENO",
           petFriendly: true,
           regaACadaDias: 14,
         },
       ],
     });

     console.log("Seed concluído: plantas de exemplo cadastradas.");
   }

   main()
     .then(async () => {
       await prisma.$disconnect();
     })
     .catch(async (error) => {
       await prisma.$disconnect();
       throw error;
     });