## <#1483266366772351067> — Midtraining & Snowball Model

Benjamin Feuer [announced](https://discord.com/channels/1354881461060243556/1483266366772351067/1527726088799649953) that Grug 67B A2B cooldown at 2T tokens ("Snowball") has landed, with SFT, chat templating, vLLM serving, and evals all working. SFT on 700K datapoints completes in under an hour and evals finish in 30 minutes. Documentation for reproduction is tracked in [issue #7321](https://github.com/marin-community/marin/issues/7321).

JeniaJitsev [flagged](https://discord.com/channels/1354881461060243556/1483266366772351067/1527988890122588180) the MATH-500 score (0.16) as suspiciously low for this training scale. willheld investigated and [found](https://discord.com/channels/1354881461060243556/1483266366772351067/1528114941360340993) that 87% of MATH-500 errors were from hitting max_tokens, with most truncated traces containing no math mistakes. After re-running with a 32k context limit, the score [jumped to 54.2%](https://discord.com/channels/1354881461060243556/1483266366772351067/1528177645118820393). The model also struggles to generate EOS, causing repetitive answer loops — possibly baked in from aggressive packing during pretraining. Ahmed M Ahmed shared [midtraining run reports](https://discord.com/channels/1354881461060243556/1483266366772351067/1527756984202297447) on dense delphi models including a val set decontamination post-mortem.

Neha Hulkund organized the midtraining breakout as a [weekly meeting](https://discord.com/channels/1354881461060243556/1483266366772351067/1527788051726602260) (noon–1pm PST), with experiment prioritization tracked in the [OpenThoughts-Next Google Doc](https://docs.google.com/document/d/15ABaJFL-VcfePE_xF8trhmkT5I9PEN9UltkZnpwg2_M/edit?usp=sharing). lukedhlee and Mrinal Kumar joined the breakout group.

## <#1364827114670657616> — Infrastructure

Larry [reported](https://discord.com/channels/1354881461060243556/1364827114670657616/1528266272297713684) the cw-us-east-08a controller as possibly fried; willheld filed [issue #7396](https://github.com/marin-community/marin/issues/7396). Russell Power [fixed it](https://discord.com/channels/1354881461060243556/1364827114670657616/1528484855007023215), noting they had somehow broken k8s. Russell also rolled the controller to fix telemetry issues and restored Benjamin Feuer's review override privileges on marin-community/harbor.

Benjamin Feuer opened an [RFC on OPD](https://github.com/marin-community/marin/issues/7236). Neha Hulkund ran into IRIS onboarding issues with non-Gmail (MIT/Outlook) accounts. Larry flagged an [Iris distributed systems issue](https://github.com/marin-community/marin/issues/7344) that Russell Power picked up, noting he wanted to add hang monitoring.

## <#1527756652890161292> — Architecture & Linear Attention

Percy Liang [raised the broader question](https://discord.com/channels/1354881461060243556/1527756652890161292/1527861096596242513) of incorporating linear attention into Marin models, mentioning Kimi delta attention and targeting GB200 NVL72. Mayank [noted](https://discord.com/channels/1354881461060243556/1527756652890161292/1528092240570880152) that KDA is too expensive on GB200 (too many exponentials) and is writing a Mamba2 implementation for TPU as a starting point. yurusankyo recovered the GDN Pallas kernels branch and pointed to GDN2 & Mamba 3 progress from FLA implementations.

Kaiyue-Wen [reported](https://discord.com/channels/1354881461060243556/1527756652890161292/1528469931555950733) promising results with [Over Embedding](https://arxiv.org/abs/2501.16975) — an additional embedding table added with <5% throughput overhead that reduced loss by 0.025 (~10% improvement) over the July baseline. Larry confirmed he'll [go with this approach first](https://discord.com/channels/1354881461060243556/1527756652890161292/1528543935192891414), pending B200 memory/speed verification. willheld clarified that Splash Attention on TPU assumes BNSH layout.

## <#1462896888000024711> — Data Pipeline & Transformation

willheld discovered that [justext blows up](https://discord.com/channels/1354881461060243556/1462896888000024711/1528087333054972086) on large HTML pages (8 hours on a single NASA publications page) due to quadratic paragraph-level comparisons in its fuzzy line dedup. He [sent a PR](https://discord.com/channels/1354881461060243556/1462896888000024711/1528146605637632071) to Michael Ryan implementing LSH for documents with 300+ paragraphs. Huu Nguyen discussed the Mixture Vitae project — putting permissive post-training data into pretraining with good results — and offered to [collaborate](https://discord.com/channels/1354881461060243556/1462896888000024711/1526982183074660453) with Marin.

## <#1462895580064911522> — Data Mixing

willheld [updated](https://discord.com/channels/1354881461060243556/1462895580064911522/1527054968924803184) the data pool accounting: the raw pool (pre-dedupe) now stands at 23T tokens, with major additions from Dolma 3.5 (AI2) and Nemotron's open data, adding ~2T code tokens and ~2T PDF tokens. Current counts are viewable at <https://huggingface.co/spaces/marin-community/token-count-viewer>.

## <#1385733711013871729> — Inference

romain [landed](https://discord.com/channels/1354881461060243556/1385733711013871729/1526388201915289642) a v0 of Grug 67B A2B GPU inference in vLLM on main, with an example test. Benjamin Feuer noted he's blocked on RL until the vLLM branch/fork is synced and a training GrugMoeForCausalLM PyTorch class is added ([issue #7164](https://github.com/marin-community/marin/issues/7164)). romain shared [context on TPU vs GPU logprobs differences](https://github.com/marin-community/marin/issues/7183), and rohithck reported vmem issues with delphi models on v5-8.

## <#1356487738840318002> — Evals

rohithck [discovered](https://discord.com/channels/1354881461060243556/1356487738840318002/1527174110604558336) that delphi's HumanEval numbers in the blogpost were actually 0-shot, not 10-shot as intended — lm_eval silently overrode the few-shot config ([issue #7229](https://github.com/marin-community/marin/issues/7229)). willheld created an [mcp-atlas-easy](https://huggingface.co/datasets/marin-community/mcp-atlas-easy) dataset for function calling evaluation. Benjamin Feuer proposed a [more robust retry mechanism](https://github.com/marin-community/evalchemy/pull/19) for Evalchemy to distinguish infra vs model errors. tdv submitted multiple PRs adding AIME 2026, OlympiadBench, and fixing existing math benchmarks.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer [reported](https://discord.com/channels/1354881461060243556/1374989195109466122/1527813564562407425) that Megatron decisively outperforms FSDP2 for RL training, prompting a switch in defaults. He also shared a paper finding that [RL essentially composes atomic skills from pretraining/SFT](https://arxiv.org/pdf/2606.18089). rav connected Benjamin Feuer with DV for potential RL environments. JeniaJitsev requested that JUPITER be tested with fully local runs independent of Daytona.

## <#1516150256499163166> — MarinFold

Al (@alxrms) opened a [draft PR (#114)](https://github.com/Open-Athena/MarinFold/pull/114) for a new token corpus produced by the bio2token neural tokenizer (a Mamba model), with data hosted on GCS. Tim O'Donnell held the weekly MarinFold meeting and shared [slides](https://docs.google.com/presentation/d/1xcNxgkrr7S81ZaoVkPJvYe_32wSOQBkr_1wL1-ohYAg/edit?usp=sharing).

## <#1365044508546568372> — MoE Architecture Planning

Larry [observed](https://discord.com/channels/1354881461060243556/1365044508546568372/1527729320758349935) that past 2T tokens, roughly half of loss decrease comes from reducing lr (cooldown) and half from learning. He created [issue #7201](https://github.com/marin-community/marin/issues/7201) to track performance of all candidate architectures for the hero run likely starting in August, focusing on MFU tradeoffs.

## Community & Newcomers

About 20 new members joined the server. Notable introductions include AlexPalms from LawZero (Bengio's nonprofit, working on large-scale distributed RL training), sokrypton (protein folding/design), Huu Nguyen (AI policy and scaling safe data), and G Sandoval (NYU, LLM security/alignment). In #general, Jeff H directed users looking for MoE models to an upcoming release from [issue #6811](https://github.com/marin-community/marin/issues/6811).

## News & Research

- Kaiyue-Wen shared [Kimi K3](https://www.kimi.com/blog/kimi-k3) highlights: Latent MoE with RMSNorm, Sigmoid Tanh Unit (SiTU), Per-head Muon, and Quantile Balancing
- Kaiyue-Wen shared [Inkling](https://thinkingmachines.ai/news/introducing-inkling/) — sliding-window + global attention at 5:1 ratio with relative positional embeddings outperforming RoPE
- willheld shared a paper on [comparing sample efficiency across model sizes](https://arxiv.org/abs/2607.12395v1)
- elie shared [jlens analysis](https://x.com/eliebakouch/status/2078663799918465199) comparing Muon vs AdamW using Marin checkpoints
- Colin Raffel asked Percy Liang about the gap between open models and Chinese frontier semi-open models, and the role of distillation attacks
