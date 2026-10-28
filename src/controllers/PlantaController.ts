import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const CAMPOS_OBRIGATORIOS = [
  "nome",
  "especie",
  "preco",
  "estoque",
  "luminosidade",
  "petFriendly",
  "regaACadaDias",
] as const;

const ID_MAXIMO = 2147483647;

// Converte o id da URL, devolve null se for inválido
const lerId = (valor: string): number | null => {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 && id <= ID_MAXIMO ? id : null;
};

// Valida só os campos enviados
// Devolve a mensagem de erro, ou null se estiver tudo certo.
const validarPlanta = (body: any, completo: boolean): string | null => {
  if (completo) {
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (body[campo] === undefined) return `O campo ${campo} é obrigatório.`;
    }
  }

  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;

  if (nome !== undefined && (typeof nome !== "string" || nome.trim() === ""))
    return "nome deve ser um texto não vazio.";
  if (especie !== undefined && (typeof especie !== "string" || especie.trim() === ""))
    return "especie deve ser um texto não vazio.";
  if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0))
    return "preco deve ser um inteiro maior que zero (em centavos).";
  if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0))
    return "estoque deve ser um inteiro maior ou igual a zero.";
  if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade))
    return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
  if (petFriendly !== undefined && typeof petFriendly !== "boolean")
    return "petFriendly deve ser true ou false.";
  if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1))
    return "regaACadaDias deve ser um inteiro maior ou igual a 1.";

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    const erro = validarPlanta(body, true);
    if (erro) return res.status(400).json({ message: erro });

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;
    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao cadastrar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome, ordem } = req.query;

    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade as Luminosidade))
      return res.status(400).json({ message: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO." });
    if (petFriendly !== undefined && petFriendly !== "true" && petFriendly !== "false")
      return res.status(400).json({ message: "petFriendly deve ser true ou false." });
    if (nome !== undefined && typeof nome !== "string")
      return res.status(400).json({ message: "nome deve ser um texto." });
    if (ordem !== undefined && ordem !== "preco" && ordem !== "nome")
      return res.status(400).json({ message: "ordem deve ser preco ou nome." });

    const plantas = await PlantaRepository.findAllPlantas({
      luminosidade: luminosidade as Luminosidade | undefined,
      petFriendly: petFriendly === undefined ? undefined : petFriendly === "true",
      nome: nome as string | undefined,
      ordem: ordem as "preco" | "nome" | undefined,
    });

    // Filtro válido sem resultado devolve [] com 200, nunca 404
    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas." });
  }
};

export const readEsgotadas = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(await PlantaRepository.findEsgotadas());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao listar plantas esgotadas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id inválido." });

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id inválido." });

    const body = req.body ?? {};
    const erro = validarPlanta(body, false);
    if (erro) return res.status(400).json({ message: erro });

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;
    const atualizada = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(atualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id inválido." });

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });

    await PlantaRepository.deletePlanta(id);
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao deletar planta." });
  }
};

export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id inválido." });

    const quantidade = req.body?.quantidade;
    if (!Number.isInteger(quantidade) || quantidade <= 0)
      return res.status(400).json({ message: "quantidade deve ser um inteiro maior que zero." });

    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });

    const vendidas = await PlantaRepository.venderPlanta(id, quantidade);
    if (vendidas === 0) {
      // reconsulta para informar o estoque atual
      const atual = await PlantaRepository.findPlantaById(id);
      return res.status(400).json({
        message: `Temos só ${atual ? atual.estoque : 0} vasos em estoque.`,
      });
    }

    return res.status(200).json(await PlantaRepository.findPlantaById(id));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
};

export const readValorTotal = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPrecoEEstoque();

    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;
    for (const planta of plantas) {
      valorTotalEmCentavos += planta.preco * planta.estoque;
      totalDeVasos += planta.estoque;
    }

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao calcular o valor do estoque." });
  }
};