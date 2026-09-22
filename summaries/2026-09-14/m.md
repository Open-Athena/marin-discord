## <#1374989195109466122> — RL Progress on Snowball

lukedhlee shared [preliminary results](https://discord.com/channels/1354881461060243556/1374989195109466122/1549558259713703986) showing the new RL stack clearly beats the old on r2egym validation — pass@1 jumps from 50.1% to 59.8% on 265 held-out tasks. On SWE-Bench 100, [RL doubles pass@1 over the base model](https://discord.com/channels/1354881461060243556/1374989195109466122/1550202720433086504), though r2egym training didn't transfer to TB2. Summarization helps at eval time even without explicit training. An experiment [distilling prompts into weights via P2O](https://discord.com/channels/1354881461060243556/1374989195109466122/1549571672426807367) didn't work for r2egym. marianna13 showed that an SFT'd model can learn further through RL when using curriculum with easy/hard task variants. Benjamin Feuer posted an [OPD proof-of-life](https://discord.com/channels/1354881461060243556/1374989195109466122/1550519202463350924) in MarinSkyRL, and Raghu is picking up cross-tokenizer OPD ([#602](https://github.com/marin-community/MarinSkyRL/issues/602)). romain [rebased vLLM on upstream](https://discord.com/channels/1354881461060243556/1374989195109466122/1550635986629951640) and bumped PyTorch to 2.13, CUDA to 13.2, and FlashAttention to 2.8.4 ([MarinSkyRL#561](https://github.com/marin-community/MarinSkyRL/pull/561)). Jeff H had Astra prototype a [pi-math multi-agent harness](https://github.com/hammer/pi-math). lukedhlee also flagged Daytona coordination issues with live snapshots being purged by an automated job.

## <#1516150256499163166> — MarinFold Updates

Tim O'Donnell posted [comprehensive weekly updates](https://discord.com/channels/1354881461060243556/1516150256499163166/1549131668957298799): training on the ProteinMPNN-expanded synthetic training set delivered a **new best model**, with R-precision improving on de novo designs (0.610→0.696) and legacy-554 (0.605→0.620). Soft-target training shows a [modest early advantage](https://discord.com/channels/1354881461060243556/1516150256499163166/1549131778424315997) (0.007 nats lower validation CE) but needs more steps. Proteina corpus generation is on track for ~1M diverse de novo monomers from ~2.5M raw structures ([#278](https://github.com/Open-Athena/MarinFold/issues/278)). The multi-hypothesis SFT pilot ([#281](https://github.com/Open-Athena/MarinFold/issues/281)) needs rework. Jacob Silterra shared [AFDB multimer curation work](https://discord.com/channels/1354881461060243556/1516150256499163166/1549189354570645764), noting the raw dataset is only 2M structures so an augmentation strategy (like DiffDockXL's cropping) may be needed.

## <#1540486417078296576> — Hero Run 2026

willheld [rebooted the hero run](https://discord.com/channels/1354881461060243556/1540486417078296576/1549470428953575484) with tweaked data mix sampling weights at ~108k steps, backed by scaling ladder comparisons ([#9126](https://github.com/marin-community/marin/issues/9126)) and a swarm of small-scale experiments. mcwitt relaunched with [ragged EP improvements giving +3% throughput](https://discord.com/channels/1354881461060243556/1540486417078296576/1549560948933791845) and a potential fix for hanging issues. dlwh posted a [summary of all major changes](https://discord.com/channels/1354881461060243556/1540486417078296576/1550174441433206785) including attention-gate weight decay, PJRT wheel updates, and the data mix change. Hudson Gouge suggested [TST (Token Sequence Training)](https://arxiv.org/abs/2605.06546) but Larry noted it's very data-hungry and Karpathy couldn't get it to beat baselines in NanoChat; the team will test it for future runs.

## <#1368297424086499359> — Data Curation & Contamination

willheld published an [initial contamination and deduplication report](https://discord.com/channels/1354881461060243556/1368297424086499359/1549916057580474409) across all SFT datasets registered in Marin ([#9212](https://github.com/marin-community/marin/issues/9212)), revealing that the contamination checker [needs tuning](https://discord.com/channels/1354881461060243556/1368297424086499359/1549917870551466135) — KernelGym was flagged at 100% due to common PyTorch import boilerplate. willheld also released a [wildchat-GLM format completions dataset](https://huggingface.co/datasets/open-athena/wildchat-glm53-format-completions) (9800 conversations). Alex Dimakis asked about SFT trajectories for a coding expert and requested GLM 5.3 annotations on the Recursive dataset. marianna13 shared TaskTrove subsets info.

## <#1355318637854199848> — SFT & Post-Training

willheld released a [new SFT Snowball checkpoint](https://huggingface.co/open-athena/Grug-67B-A2B-Datakit-SFT-262K-2026.09.16) that behaves much more reasonably, with router and bias freezing pulled in to prevent token routing from going unstable. willheld also [raised the question](https://discord.com/channels/1354881461060243556/1355318637854199848/1549961026949353582) of how to initialize special tokens from chat templates, citing several approaches. Benjamin Feuer shared the [post-training roadmap](https://discord.com/channels/1354881461060243556/1354881461060243561/1549793034877673654) targeting an ~October 6 debut, with expert submissions needed within 10-12 days.

## <#1356487738840318002> — Evals

Benjamin Feuer published the [latest Marin eval policy](https://github.com/marin-community/marin/issues/9193). lukedhlee identified that the pinned harbor config [enables summarization by default](https://discord.com/channels/1354881461060243556/1356487738840318002/1550005602321960990) and shared results showing the effect of token limit and summarization ablation on eval scores — even without explicit summarization training, it helps.

## <#1527756652890161292> — Architecture & Looped Transformers

dlwh flagged a paper on [scaling laws for looped transformers](https://arxiv.org/abs/2609.19107) that also examines model depth scaling, noting it finds looping is regularizing in data-limited regimes. Ahmed M Ahmed [suggested](https://discord.com/channels/1354881461060243556/1527756652890161292/1550898931452477611) looped architectures could save on all-to-all communication costs compared to MoEs, and proposed composing fewer experts with looping. Kaiyue-Wen noted the compute-bounded regime may limit gains. dlwh clarified interest in the paper's depth scaling insights even for un-looped models.

## <#1365058937589858324> — Infrastructure & Code

Russell Power's Marin infrastructure talk was the [most-reacted message of the week](https://discord.com/channels/1354881461060243556/1354881461060243561/1549081701727346698) (20 reactions from Percy Liang's announcement). mcwitt landed a [PJRT wheel update for +2.8% throughput](https://github.com/marin-community/marin/pull/9179), a [plausible fix for ragged A2A hangs](https://github.com/marin-community/marin/pull/9183) by disabling PDL, and a [coordinated GC pause PR](https://github.com/marin-community/marin/pull/9224) for ~3% step time reduction. dlwh posted a [spike to unify agentic and non-agentic datasets](https://github.com/marin-community/marin/pull/9187) and [standardized the QB MoE implementation](https://discord.com/channels/1354881461060243556/1365058937589858324/1550263654446927913).

## <#1365044508546568372> — MoE Router Issues

mcwitt flagged [alarming router metric excursions](https://discord.com/channels/1354881461060243556/1365044508546568372/1550547629958504620) on the d768 scaling ladder rung on `main`, suspecting changes in [PR #9159](https://github.com/marin-community/marin/pull/9159). Investigation is ongoing with a Wandb report shared.

## <#1500987824206254120> — Tokenizer

Larry trained BPE tokenizers at 16k, 32k, 64k, and 128k vocab sizes on the hero datamix and found that [vocab beyond 16k yields surprisingly small compression gains](https://discord.com/channels/1354881461060243556/1500987824206254120/1550036882480566272). Hudson Gouge confirmed 32k is sufficient for English-only.

## <#1550024637927268392> — Mechanistic Interpretability

A new #mechinterp channel was created this week! Jeff H kicked it off by sharing several framing papers: [Interpretability Can Be Actionable](https://arxiv.org/abs/2605.11161) for guiding architectural design, [Can Interpretation Predict Behavior on Unseen Data?](https://arxiv.org/abs/2507.06445) for OOD prediction, and [There Will Be a Scientific Theory of Deep Learning](https://arxiv.org/abs/2604.21691) on learning dynamics.

## <#1546528166086967306> — Speculative Decoding & MTP

lukedhlee showed that a [frozen Eagle3 draft model doesn't drift from RL](https://discord.com/channels/1354881461060243556/1546528166086967306/1549560148320722985) even after 60 steps on r2egym, with an interesting side effect: as the target model's entropy falls, the draft model's acceptance rate increases and accelerates rollouts.

## <#1375164400239120504> — Community Growth

~68 new members joined the server this week across multiple waves. 11 people posted introductions in <#1357057383830126652>, including Austin Huang (ex-Google Brain/DeepMind, gemma.cpp), researchers from Cambridge, CMU, Yale, and UWaterloo, and engineers from Netflix and SpaceXAI. Hantao Lou's request for a mech interp channel [led to its creation](https://discord.com/channels/1354881461060243556/1357057383830126652/1550012044172853324) by Mark.

## News & Research

- Kyle O'Brien shared a [blog on compute procurement for research nonprofits](https://www.lesswrong.com/posts/aCGx79eGafwDcXEgf/reducing-the-resource-gap-between-lab-and-external-safety), sparking discussion with Jeff H about GPU supplier capacity and pricing
- romain flagged a [paper on mitigating training-inference mismatch](https://arxiv.org/pdf/2609.20807) and plans to test it, though Russell Power noted it may be similar to TIS for current setups
- elie shared a tweet about a live training dashboard that may have drawn inspiration from Marin, prompting dlwh to note they "need to up our dashboard game"
- Ayush Nangia shared the [Mimo RL training live dashboard](https://mimo.xiaomi.com/rl/#overview)
- austinvhuang replicated "yesterday's model du jour" and noted common misconceptions about the approach
