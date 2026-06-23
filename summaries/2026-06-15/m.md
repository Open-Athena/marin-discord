## <#1382240679765217342> — Muon Newton-Schulz Coefficients & Hyperball

Ahmed M Ahmed kicked off a deep investigation into why Marin's default Muon Newton-Schulz coefficients are labeled 'quintic' rather than 'polar express,' [tracing the origin](https://discord.com/channels/1354881461060243556/1382240679765217342/1516203264742527007) to a [nano-GPT speedrun submission by LeLoykun](https://leloykun.github.io/ponder/muon-opt-coeffs/). Larry [confirmed the coefficients](https://discord.com/channels/1354881461060243556/1382240679765217342/1516208057766383706) use per-iteration tuned values unlike the original Newton-Schulz, and noted the Polar Express method's coefficients from modded-nanogpt may be slightly better. He [filed issue #4281](https://github.com/marin-community/marin/issues/4281) and started ablation runs. Kaiyue-Wen [weighed in](https://discord.com/channels/1354881461060243556/1382240679765217342/1516246787604877366) that in his experience the differences are noise-level.

Russell Power shared an [experiment on delayed-gradient pipeline parallelism with Muon](https://github.com/marin-community/marin/issues/6431#issuecomment-4723408436), finding Muon is much more robust to stale gradients than AdamH — though still worse than sync training.

Evan Walters [praised Kaiyue-Wen's hyperball](https://discord.com/channels/1354881461060243556/1382240679765217342/1516910390708011048). HessianFree asked about switching from Adam to hyperball mid-run; Kaiyue-Wen [advised](https://discord.com/channels/1354881461060243556/1382240679765217342/1517016423119978496) it's smooth if you compute the corrected LR, and that setting R_0 to the expected Frobenius norm with std 1/√d works better than using AdamC's equilibrium norm. Larry [flagged](https://discord.com/channels/1354881461060243556/1382240679765217342/1517017643952111737) that bfloat16 params (vs fp32) aren't working as expected on TPU, possibly due to rounding during hyperball.

## <#1364827114670657616> — Iris Controller OOM & Infra Fixes

willheld [accidentally OOM'd the Iris controller](https://discord.com/channels/1354881461060243556/1364827114670657616/1516400550470746112) by launching too many eval jobs simultaneously, requiring a DB restore and restart. Russell Power identified the root cause and [proposed submission rate limits](https://discord.com/channels/1354881461060243556/1364827114670657616/1516431794138775663) as the fix. He also fixed a [preemption failure bug](https://github.com/marin-community/marin/pull/6432/changes) that was incorrectly marking Eric Czech's jobs as failed, and a [duplicate worker IP issue](https://github.com/marin-community/marin/pull/6445) caused by GCP reusing IPs.

Al (@alxrms) [explained](https://discord.com/channels/1354881461060243556/1364827114670657616/1516521559312044032) why Claude agents keep using local imports (defensive against transitive deps); Russell noted they've enabled the ruff no-local-import lint check. romain [updated](https://discord.com/channels/1354881461060243556/1364827114670657616/1516948240501706762) vllm, JAX, libtpu, torch and other deps on main. Al got approval to run CPU-only DataFusion/Cubed experiments on Iris at batch priority.

## <#1375164400239120504> — Community Growth

33 new members joined the server this week, with a notable wave of ~15 arrivals on June 20.

## <#1514477129134247946> — Perplexity Gaps in JSON Understanding

Bilibird and dlwh [discussed](https://discord.com/channels/1354881461060243556/1514477129134247946/1516093888543064074) Marin's perplexity gaps on Stack v2 JSON data. dlwh [observed](https://discord.com/channels/1354881461060243556/1514477129134247946/1516150976808227087) from heatmaps that Marin simply doesn't understand JSON delimiters well, and [suggested](https://discord.com/channels/1354881461060243556/1514477129134247946/1516179807740629052) the gap between synthetic structured tasks and real JSON is likely driven by ICL effects. Bilibird proposed bibtex completion tasks as a more grounded evaluation of structured content understanding.

## <#1399998407657001062> — Muon + FSDP Scaling Wall on GPU

dlwh posted a [detailed analysis](https://discord.com/channels/1354881461060243556/1399998407657001062/1518073937186259134) showing that Muon's Newton-Schulz orthogonalization is fundamentally unfriendly to FSDP: the optimizer-side compute and comms are large relative to forward/backward, and the comms don't scale away with node count. Proposed solutions include minibatched grouped Muon (overlapping NS updates with other compute), pipeline parallelism, or cross-node expert parallelism. Russell Power [noted](https://discord.com/channels/1354881461060243556/1399998407657001062/1518257150382571652) he'd coincidentally been investigating PP and that Muon has nice properties for stale gradient updates. dlwh [acknowledged](https://discord.com/channels/1354881461060243556/1399998407657001062/1518301484897271928) PP seems inevitable and plans to tackle it this week with Russell's help (see [issue #6493](https://github.com/marin-community/marin/issues/6493#issuecomment-4760616407)).

## <#1357057383830126652> — New Member Introductions

12 introductions this week, including Sparsh (MIT CSAIL), Abhash (OpenEuroLLM/ELLIS Tübingen, interested in scaling laws and alignment), bertø (SWE pivoting to ML), Mefaro (NLP PhD, founder of Calibrion AI), Sean from Parasma (YC-funded, training brain cells for compute), Albert (Avito, open-sourced [Avibe models](https://huggingface.co/AvitoTech/avibe)), and Stewy Slocum (MIT PhD on leave from xAI, interested in AI R&D evals from Marin experiment histories).

## <#1366632114316906506> — Code Discussions

dlwh and Russell Power [debated](https://discord.com/channels/1354881461060243556/1366632114316906506/1516157236798427287) whether pinning accelerator jobs to a minimum of 32 CPU cores was too aggressive — the issue is that 8× single-GPU jobs can't fit on CW cluster nodes with only 16 CPUs/GPU. They agreed to lower the floor. dlwh also [reported](https://discord.com/channels/1354881461060243556/1366632114316906506/1516928577143046221) a Codex compaction error with 5.4-mini; romain suggested enabling `remote_compaction_v2` as a fix.

## <#1365044508546568372> — MoE Architecture Experiments

Larry shared results showing [MuonH maintains its advantage over AdamH](https://discord.com/channels/1354881461060243556/1365044508546568372/1516145091734016162) even at 5000× tokens-per-parameter overtrain, surprising the team. He also found that [alternating dense/MoE layers](https://discord.com/channels/1354881461060243556/1365044508546568372/1516827092334149684) (instead of shared+routed) gives the same loss with ~20% better tokens/sec on TPU at small scale, and asked dlwh to verify on GPU.

Larry [flagged GLM 5.2's release](https://discord.com/channels/1354881461060243556/1365044508546568372/1516857141514997881) as the new leading open model, noting its Multi-Head Latent Attention with IndexShare across 4-layer groups and multi-token prediction — both features Marin should adopt.

## <#1516150256499163166> — MarinFold Protein Structure Prediction

Tim O'Donnell [launched the #marinfold channel](https://discord.com/channels/1354881461060243556/1516150256499163166/1516151004658274464) for discussion of training Marin models on protein structure prediction (<https://github.com/Open-Athena/MarinFold>). Al (@alxrms) [contributed a zephyr pipeline performance skill](https://github.com/Open-Athena/MarinFold/pull/84) with principles including "fail loudly instead of hiding errors." Tim announced a MarinFold meeting for Monday 6/22 at 3:30pm ET.

## <#1354881461060243561> — General Announcements

dlwh [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1516180186410778624) the new #marinfold and #dna channels for bio applications. uwu1 (mxfp31) [expressed interest](https://discord.com/channels/1354881461060243556/1354881461060243561/1516196913232482444) in replicating engram memory scaling experiments on Marin.

## <#1500987824206254120> — Tokenizer & Training Data Composition

Pranshu Chaturvedi [detailed](https://discord.com/channels/1354881461060243556/1500987824206254120/1516207744225513603) the 1.1T token corpus composition (Common Pile, FinePDFs, Nemotron, StarCoder2, plus synthetic sources). rav [clarified](https://discord.com/channels/1354881461060243556/1500987824206254120/1516234212724969642) the data is normalized but not fully deduped. Pranshu asked about good heldout datasets for MoE ladder training given likely C4/Paloma leakage; rav [suggested](https://discord.com/channels/1354881461060243556/1500987824206254120/1516236855023108226) decontaminated samples or Michael's synthetic data.

## <#1365058937589858324> — Code Review Highlights

tdv requested reviews on [8 PRs adding pretraining/midtraining data](https://discord.com/channels/1354881461060243556/1365058937589858324/1516137916164997180). Russell Power sent rav [PR #6438](https://github.com/marin-community/marin/pull/6438) removing Iris reservations entirely, and [PR #6430](https://github.com/marin-community/marin/pull/6430) eliminating the top-level `uv run iris` in favor of experiment-owned launching. mcwitt submitted [PR #6473](https://github.com/marin-community/marin/pull/6473) adding `dev_gpu` support analogous to `dev_tpu`. Russell also asked for review on [PR #6466](https://github.com/marin-community/marin/pull/6466) to replace web-only IAP with universal auth.

## <#1356490712199462912> — Scaling Laws Clarification

Ahmed M Ahmed [noticed](https://discord.com/channels/1354881461060243556/1356490712199462912/1516228659738968135) a discrepancy between the Delphi blog (2.5B reference tokens) and the reference script (1B tokens). willheld [clarified](https://discord.com/channels/1354881461060243556/1356490712199462912/1516249262353154089) that "reference" in the `references/` directory means "example file for how to do a hparam sweep," not a reference model.

## <#1483266366772351067> — Midtraining Pipeline Results

Benjamin Feuer [posted a write-up](https://discord.com/channels/1354881461060243556/1483266366772351067/1517650624915836928) of end-to-end pretraining → post-training experiments on Delphi models. Ahmed M Ahmed was [surprised](https://discord.com/channels/1354881461060243556/1483266366772351067/1517653151711494355) that the pipeline produced non-zero AIME scores even when midtraining used nemotron cc math rather than nemotron math. RL-after-SFT experiments are still pending.

## <#1380235124011958313> — Long Context Strategy

willheld [shared](https://discord.com/channels/1354881461060243556/1380235124011958313/1516491639097659426) the new data pool's context-length distribution (61% of tokens in docs >1k, 19% >32k, 12% >64k). Larry [outlined](https://discord.com/channels/1354881461060243556/1380235124011958313/1516509704535281666) the plan: test staged context extension (4k→32k, 8k→64k) at small scale, then extend the 67B model to 262k in a final ≤150B token stage. Bilibird noted GLM 5.2's IndexShare approach for long-context training.

## <#1374989195109466122> — Reinforcement Learning

marianna13 [reported](https://discord.com/channels/1354881461060243556/1374989195109466122/1516480336438099978) that sequence-mean reduction looks promising for defeating RL collapse (60+ steps stable where token-mean was unstable), but transfer plateaus quickly.

## <#1368297424086499359> — Data Curation

willheld shared a "Data Mixing Rorschach test" visualization. Benjamin Feuer welcomed new contributor Vincent S Chen.

## News & Research

- **GLM 5.2 released** — New leading open model with MLA + IndexShare across 4-layer groups and multi-token prediction. [Blog post](https://z.ai/blog/glm-5.2)
- **OpenAI/Google/Microsoft trust layer** — Benjamin Feuer shared the announcement; Russell Power was [duly reassured](https://discord.com/channels/1354881461060243556/1356487690559684638/1516923155329843370)
- willheld shared an RL paper: <https://arxiv.org/pdf/2503.18892>
- [Muon optimizer coefficient origins](https://leloykun.github.io/ponder/muon-opt-coeffs/) — nano-GPT submission traced by Ahmed
