## <#1516150256499163166> — MarinFold

Tim O'Donnell posted a comprehensive [weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1536430836428312617) covering major progress. Eric Czech's sweep on ESMFold2 distillation data produced their **best model yet** — the `p06-aug` CoreWeave run achieved contacts-v1 loss 2.971 and **R-precision 0.587 all / 0.542 long** ([#199](https://github.com/Open-Athena/MarinFold/issues/199), [#204](https://github.com/Open-Athena/MarinFold/pull/204), [#205](https://github.com/Open-Athena/MarinFold/pull/205)). Tim later [found](https://discord.com/channels/1354881461060243556/1516150256499163166/1536778836384161883) R-precision may actually be ~0.61, possibly due to an evaluation discrepancy Eric is investigating.

A **multi-draft generator** was fine-tuned to emit ~15 near-disjoint candidate contact maps in a single rollout while maintaining task accuracy ([#163](https://github.com/Open-Athena/MarinFold/issues/163)). Pause/think tokens were a **negative result** — no contact accuracy improvement with 1-3 inserted `<think>` tokens ([#124](https://github.com/Open-Athena/MarinFold/issues/124)). The team is de-risking a **contact-conditioned diffusion folding** module via the revamped helico repo ([helico#10](https://github.com/Open-Athena/helico/pull/10)). Upcoming: Tim O'Donnell is getting RL working for multi-draft ([#200](https://github.com/Open-Athena/MarinFold/issues/200)), and Eric Czech will decide whether to continue training the best checkpoint.

## <#1365044508546568372> — MoE Scaling & Training

Larry reported the **67B-A2B scaling looks predictable** through the first 8T tokens, with even a 19M active model being predictive at 4000 tokens/active-param ratio ([details](https://github.com/marin-community/marin/issues/6044#issuecomment-5290016560)). Percy Liang [asked](https://discord.com/channels/1354881461060243556/1365044508546568372/1537694753834143784) about early cooldowns; retroactive fitting suggests those are predictive too.

A **hardware test on 640 GPUs** ran the 24B-active / 535B-param model for 125B tokens over 16 hours without issues — though Larry [noted](https://discord.com/channels/1354881461060243556/1365044508546568372/1536781988378185908) it inadvertently epoched 21× over SlimPajama. dlwh shared that adding shuffle to eval [closes ~half](https://discord.com/channels/1354881461060243556/1365044508546568372/1536503625227051128) the dropless/dropful gap ([#8134](https://github.com/marin-community/marin/issues/8134)). Larry launched **Adam beta1 ablations** at [0.9](https://wandb.ai/marin-community/marin_moe/runs/mhep-abl-d768-beta1-090-20260812) and [0.91](https://wandb.ai/marin-community/marin_moe/runs/mhep-abl-d768-beta1-091-20260812) to test their current 0.9061 coefficient, and found that a model trained with 4 active experts [evals slightly better](https://discord.com/channels/1354881461060243556/1365044508546568372/1538454439059521566) with 5 or 6 active.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer [reported](https://discord.com/channels/1354881461060243556/1374989195109466122/1537812389347721360) that after patching numerics and stability issues in MSkyRL, **long-horizon RL runs are now much more stable**, enabling experiments with 400 steps / 10 epochs (up from 80/2) on Qwen3 Coder 30B A3B Instruct. marianna13 cautioned about potential overfitting on small datasets and suggested better reward shaping. Benjamin [requested](https://discord.com/channels/1354881461060243556/1374989195109466122/1536811897523929209) SFT checkpoints of Qwen3 MoEs (Thinking 30B A3B and Coder 30B A3B Instruct) on the OT-Agent hero dataset, with marianna13 suggesting the tezos dataset. lukedhlee shared [Learning, Fast and Slow](https://arxiv.org/pdf/2605.12484) as a prompt/harness optimization idea for future work.

## <#1527756652890161292> — Architecture

Mayank completed the **depthwise causal convolution kernel** for TPU (fwd + bwd) and opened [PR #8331](https://github.com/marin-community/marin/pull/8331), with **linear attention** also done and awaiting a separate PR. Kaiyue-Wen [proposed](https://discord.com/channels/1354881461060243556/1527756652890161292/1537565848108015687) a parameter-preserving YOCO-style architecture that shares KV cache across the later half of layers to speed up prefill ([#8196](https://github.com/marin-community/marin/issues/8196), inspired by [YOCO](https://arxiv.org/abs/2405.05254)). Larry [noted](https://discord.com/channels/1354881461060243556/1527756652890161292/1537575342959493225) the speedup depends heavily on optimal layer cut point — massive if at the midpoint of a 60-layer model. willheld shared [pipeline-parallel modeling](https://discord.com/channels/1354881461060243556/1527756652890161292/1536880244156272801) for large MoEs on H100s.

## <#1365058937589858324> — Code Review & Infrastructure

mcwitt landed a change that [reduces compile times by 75%](https://discord.com/channels/1354881461060243556/1365058937589858324/1537238961666392155) by requiring `module.init` to be vmappable ([PR #8206](https://github.com/marin-community/marin/pull/8206)). He also [found a correctness bug](https://discord.com/channels/1354881461060243556/1365058937589858324/1537532822825467964) in the fused CE loss kernel where forward accumulated in bfloat16 vs float32 in backward ([PR #8217](https://github.com/marin-community/marin/pull/8217)) — this was the active kernel in hero templates. dlwh handed off a [+2.23% throughput PR](https://github.com/marin-community/marin/pull/8153) on 64 GPUs to mcwitt, and continued progress on the mok work ([#8108](https://github.com/marin-community/marin/issues/8108)).

## <#1484315476325826660> — OpenThoughts & Agent SFT

Benjamin Feuer organized a [walkthrough session](https://discord.com/channels/1354881461060243556/1484315476325826660/1537145283350233260) of the OT-Agent SFT pipeline for Neha Hulkund and others. JeniaJitsev [raised concerns](https://discord.com/channels/1354881461060243556/1484315476325826660/1538112364010807347) about **MarinSkyRL lagging behind upstream SkyRL** on features like FP8 rollout support, asking about maintaining parity. Alex Dimakis visited the OA/laude office on Tuesday.

## <#1356487738840318002> — Evals

Lisa Sun opened a [draft PR for NUPA/Number Cookbook integration](https://github.com/marin-community/evalchemy/pull/76) into Evalchemy ([#7297](https://github.com/marin-community/marin/issues/7297)). Benjamin Feuer asked Mrinal Kumar to re-eval the GLM base model on ID benchmarks after terminus-2 fixes, and to eval a first snowball SFT model. Mrinal [reported](https://discord.com/channels/1354881461060243556/1356487738840318002/1537867653836841090) GLM is slower with many AgentTimeOut errors due to excessive thinking.

## <#1356490712199462912> — Scaling Laws

mansimov shared a [paper extending Chinchilla](https://arxiv.org/abs/2608.07222) by adding an exponent for data-model size dependency, sparking [discussion](https://discord.com/channels/1354881461060243556/1356490712199462912/1537092749101371542) on how closely practitioners actually follow scaling laws vs. just maximizing data and model size. Eric Czech noted scaling laws are more useful for curriculum decisions than pure model sizing. dlwh and Jeff H agreed that **legibility** of scaling results should be a priority once the hero run launches.

## <#1462895580064911522> — Data Mixing & Curation

willheld shared a [topic bucket viewer](https://discord.com/channels/1354881461060243556/1462895580064911522/1536427703161331754) derived from Harrier embeddings showing 40 topics across their data corpus, and linked a paper providing [continued evidence for not saving data vs mixing](https://arxiv.org/abs/2605.12705). rav announced a 10% sample of new data in a token store. In <#1368297424086499359>, willheld shared [GLM 5.2 generations on OT4 Code prompts](https://huggingface.co/datasets/marin-community/openthoughts4-code-9168-prompts-glm-5.2-n4), and lukedhlee proposed a [teacher prompt optimization idea](https://discord.com/channels/1354881461060243556/1368297424086499359/1537145094824534111) to produce student-favored trajectories.

## <#1380235124011958313> — Long Context

Ahmed M Ahmed asked about the [long context plan](https://discord.com/channels/1354881461060243556/1380235124011958313/1537125309273350245) for hero runs. Larry [detailed](https://discord.com/channels/1354881461060243556/1380235124011958313/1537148829231620126) the strategy: the 10T run will scale from 8k to **65k context** for the last 1T tokens using YaRN-style attention sharpness scaling (1.3→1.57) with NoPE on global layers, then extend to **262k** with upweighted long-context docs. He explained that shorter seqlen (starting at 4k) is necessary due to aggressive dropping with fixed all-to-all EP — fewer sequences per batch means more token dropping.

## <#1500987824206254120> — Tokenizer

willheld posted a [compression comparison](https://gist.github.com/Helw150/621a51303b3414d4ce78f2492a4aed0c) of Llama 3 vs Nvidia/Mistral's Tekken tokenizer (same vocab size). **Tekken is notably less compressive for code**, making it worse overall for their corpus. Bilibird [noted](https://discord.com/channels/1354881461060243556/1500987824206254120/1538013493180112986) compression isn't the only metric — vocab represents inductive bias on semantics.

## <#1382240679765217342> — Optimizers

Ahmed M Ahmed [shared](https://discord.com/channels/1354881461060243556/1382240679765217342/1538639357764968590) that optimal hyperparameters vary significantly across data mixes (paper forthcoming). He also linked a new Muon variant; Larry [questioned](https://discord.com/channels/1354881461060243556/1382240679765217342/1538683797611090021) its novelty since batching and symmetric matmul have been common, but noted interest in their partial row orthogonalization approach.

## <#1357057383830126652> — Community & Newcomers

28 new members joined the server. Notable introductions: **Jean du Terrail** (Living Models, genomic LMs for agriculture, [most-reacted message](https://discord.com/channels/1354881461060243556/1357057383830126652/1536792757698564187)), **amy** (ex-Hugging Face MLE), **rliaw** (Ray co-author), **jasonkrone** (Biohub, bio foundation models), **JonasL** (NIH computational biology), and several others from academia and industry.

## <#1418673157585502370> — DNA

Gonzalo Benegas reported a [first RAG prototype](https://discord.com/channels/1354881461060243556/1418673157585502370/1537162663849889822) performing generally better than their blog post model ([#402](https://github.com/Open-Athena/marin-dna/issues/402)).

## News & Research

- Percy Liang shared [Historical Books OCR Leaderboard](https://huggingface.co/blog/finebooks/historical-books-ocr-leaderboard) from FineBooks
- Colin Raffel flagged a paper on [making scaling laws more reliable at small scales](https://arxiv.org/abs/2608.11859)
- mansimov shared a [Chinchilla extension paper](https://arxiv.org/abs/2608.07222) adding data-model size dependency
- lukedhlee shared [Learning, Fast and Slow: Towards LLMs That Adapt Continually](https://arxiv.org/pdf/2605.12484)
- Bilibird linked a [skill-identification data selection paper](https://arxiv.org/pdf/2601.03111)
- willheld shared evidence paper on [data mixing vs saving](https://arxiv.org/abs/2605.12705)
- yifan_amber (MSR intern) [shared slides](https://discord.com/channels/1354881461060243556/1357769641132298321/1537317356580380713) on data selection methods with experiments on Marin base models
