## <#1354881461060243561> — 1e23 MoE Completion & Learning Rate Schedule Debate

dlwh announced the [compute-optimal 1e23 MoE is finished](https://discord.com/channels/1354881461060243556/1354881461060243561/1506713859824816269) — 130B parameters, 16B active, trained on 1T tokens, with final Paloma macro-average loss of 2.234, less than 1% off from the [preregistered prediction of 2.252](https://github.com/marin-community/marin/issues/4447#issuecomment-4225593039) derived from runs 333× smaller. The model showed 6× better FLOP efficiency than dense Delphi models. Percy Liang also posted a [comprehensive project update](https://discord.com/channels/1354881461060243556/1354881461060243561/1506176338250170520) covering 18T tokens gathered, new Iris infrastructure, and the MoE milestone.

A substantial debate on **linear decay vs WSD scheduling** emerged. Larry explained that they [moved to linear decay](https://discord.com/channels/1354881461060243556/1354881461060243561/1508126947006349483) primarily because it reaches lower loss with tuned LR when hyperball normalization is active, not for stability reasons. JeniaJitsev [pushed back](https://discord.com/channels/1354881461060243556/1354881461060243561/1508211101806886933), arguing WSD's flexibility for evaluating at multiple token budgets is valuable and that loss differences often don't translate to stronger downstream evals. Larry [noted](https://discord.com/channels/1354881461060243556/1354881461060243561/1508221568491458681) that hyperball + WSD is "a bit suspect" since the usual parameter norm growth that reduces effective LR no longer occurs, but acknowledged the decision isn't clear-cut pending downstream eval comparison. Ahmed M Ahmed also [flagged](https://discord.com/channels/1354881461060243556/1354881461060243561/1507941123744596040) the schedule switch as potentially significant.

## <#1356487738840318002> — Evals, Metrics & Tokenizer Choice

Discussion on tokenizer selection for evals: Percy Liang [asked](https://discord.com/channels/1354881461060243556/1356487738840318002/1505990229146730558) whether to use the Qwen tokenizer, and dlwh [noted](https://discord.com/channels/1354881461060243556/1356487738840318002/1505990381979046180) they shouldn't use LLaMA3 and likely not Qwen either for monolingual targets. dlwh [pointed to](https://discord.com/channels/1354881461060243556/1356487738840318002/1505991302121128146) [TokenMonster](https://github.com/alasdairforsythe/tokenmonster) based on a [TokSuite paper](https://arxiv.org/pdf/2512.20757) from Colin Raffel's lab. Colin Raffel [cautioned](https://discord.com/channels/1354881461060243556/1356487738840318002/1506287508592394330) that "tokenmonster is super cool but also weird" and offered to connect with Gül Sena who has done more multilingual tokenization work. Bilibird [filed issue #5842](https://github.com/marin-community/marin/issues/5842) for further investigation.

For MCQA eval metrics, willheld and dlwh [discussed](https://discord.com/channels/1354881461060243556/1356487738840318002/1506920595160436737) that `choice_logprob` is being used in current experiments, while BPB over whole strings is fine for monitoring on the PPL dashboard. willheld [clarified](https://discord.com/channels/1354881461060243556/1356487738840318002/1506918256093429911) that `choice_prob` correlates better with accuracy, while plain `prob`/`logprob`/`bpb` is weaker but more predictable with compute.

Benjamin Feuer shared an [interactive scaling laws analysis page](https://discord.com/channels/1354881461060243556/1356487738840318002/1507129459386487005) with slider diagrams for Chinchilla/Sardana-optimal comparisons and MoE compute-optimal modeling. willheld [noted](https://discord.com/channels/1354881461060243556/1356487738840318002/1507184887084482671) that DCLM baseline was omitted from the Marin 8B retro eval because it has no midtraining, making the comparison unfair to DCLM.

## <#1500987824206254120> — Tokenizer Development & Benchmarking

Pranshu Chaturvedi is working on [issue #5821](https://github.com/marin-community/marin/issues/5821) for tokenizer testbed evaluation. Bilibird [filed issue #5837](https://github.com/marin-community/marin/issues/5837) showing >5% vocabulary reduction using TokenMonster's key technique across several tokenizers. dlwh [found](https://discord.com/channels/1354881461060243556/1500987824206254120/1506174473118683167) the reduction less than expected and noted too many confounds in the TokSuite paper (32K vocab, no bytes fallback for TokenMonster).

Pranshu Chaturvedi benchmarked tokenizer throughput, achieving [~800k+ tok/s on a single CPU](https://discord.com/channels/1354881461060243556/1500987824206254120/1507531411748552865) for the Marin tokenizer on Iris, though multi-worker strong scaling still needs debugging. The team plans to evaluate tokenizers at 32k and 64k sizes in addition to the existing 128k, since [embedding matrices would dominate](https://discord.com/channels/1354881461060243556/1500987824206254120/1507584746488725614) the parameter count for the many sub-billion models they train.

## <#1364827114670657616> — Iris Infrastructure Instability & LoRA Revival

The Iris controller experienced [repeated sluggishness](https://discord.com/channels/1354881461060243556/1364827114670657616/1507056706897580082) throughout the week, with rav identifying a [bug in the ConcurrencyLimitInterceptor](https://discord.com/channels/1354881461060243556/1364827114670657616/1507424362284716113) and deploying multiple fixes. Russell Power noted a [dashboard glitch](https://discord.com/channels/1354881461060243556/1364827114670657616/1506716087339712723) where the autoscaler was out of sync with the scheduler, and TPU quota was exhausted in us-central1-a.

Ahmed M Ahmed [announced](https://discord.com/channels/1354881461060243556/1364827114670657616/1507158614127808693) a PR reviving LoRA to reduce storage costs, with extensive DPO fine-tuning experiments showing LoRA matching or slightly exceeding full fine-tuning. His approach uses a non-traditional init (A matrix zeros, B matrix from pretrained weights). willheld asked Michael Ryan/Kevin Xiang Li to [point Benjamin Feuer to distributed inference tooling](https://discord.com/channels/1354881461060243556/1364827114670657616/1507457522544541926) to avoid cross-region egress.

## <#1462895580064911522> — Data Mixing & New Datasets

Benjamin Feuer surfaced several new datasets including [HAL Open Science math papers](https://discord.com/channels/1354881461060243556/1462895580064911522/1506333828942270664), [32B tokens of math reasoning](https://huggingface.co/datasets/tokyotech-llm/swallow-math-v2), [UltraData-Math](https://ultradata.openbmb.cn/datasets/UltraData-Math-L2), multiple arXiv datasets, and government documents. dlwh [tasked his bot](https://discord.com/channels/1354881461060243556/1462895580064911522/1506388373286293618) to create issues and PRs for ingestion.

dlwh [raised](https://discord.com/channels/1354881461060243556/1462895580064911522/1506388871334858792) the question of creating IID validation sets for new data groups. willheld clarified they want IID samples from all datakit sources, and rav suggested splitting at normalization time. dlwh [suggested](https://discord.com/channels/1354881461060243556/1462895580064911522/1506427900889661481) either post-dedup or treating it as decontamination.

## <#1368297424086499359> — Data Curation & Quality Tagging

willheld ran [intruder tests](https://discord.com/channels/1354881461060243556/1368297424086499359/1506335612016263318) comparing Marin's domain/quality taggers vs Dolma3 taggers. Results showed Marin's domain tagger at 50% agreement vs Dolma3 at 35%, and quality tagger at 40% vs 10% for Dolma3. willheld [concluded](https://discord.com/channels/1354881461060243556/1368297424086499359/1506396892249194567) the study was underpowered but sufficient to confirm the new tagging isn't worse.

## <#1365058937589858324> — Code Review & PRs

willheld proposed a [`users://` fsspec layer](https://github.com/marin-community/marin/pull/5832) for per-user GCS storage attribution and fixed a [multi-host training bug](https://github.com/marin-community/marin/pull/5871) caused by Russell Power's background tracker change not collecting arrays before logging. Michael Ryan submitted [Zephyr heartbeat tolerance changes](https://github.com/marin-community/marin/pull/5875) for distributed inference. Ahmed M Ahmed's [LoRA PR #4637](https://github.com/marin-community/marin/pull/4637) is ready for review, with dlwh [noting](https://discord.com/channels/1354881461060243556/1365058937589858324/1507155416617058354) the non-standard LoRA init deserves its own blog post.

## <#1493722964644990996> — Downstream Scaling Laws

rohithck [reported](https://discord.com/channels/1354881461060243556/1493722964644990996/1506401125471879298) that GSM8k loss extrapolation from <1e21 to 1e23 was off by ~0.1 nats, with models consistently doing better than predicted. willheld confirmed similar underprediction in the blog results (.366 BPB vs 0.38 BPB predicted). rohithck is also [developing tunable-difficulty benchmarks](https://discord.com/channels/1354881461060243556/1493722964644990996/1506407674294829217) (e.g., randomly masking solution tokens with varying probability) as pretraining proxies, with promising initial extrapolation results.

## <#1365044508546568372> — MoE Ablation Cleanup

dlwh [organized a comprehensive table](https://discord.com/channels/1354881461060243556/1365044508546568372/1506065354877702186) of MoE experiment verdicts. **Resolved:** E=128 passes (improves with scale), attention gating should be kept (truncated 1/16 gate acceptable), shared experts kept, first-k dense layers kept. **Still open:** MuonH/NorMuonH optimizer work is active, QB vs sign+aux routing question unresolved, z-loss removal looks bad but raised z-loss needs more study. Larry noted [surprise](https://discord.com/channels/1354881461060243556/1365044508546568372/1506087923638997075) that optimal LR under MuonH seems very similar to AdamH.

## <#1380235124011958313> — Long-Context Pretraining Ideas

dlwh [proposed](https://discord.com/channels/1354881461060243556/1380235124011958313/1507525581699285044) synthesizing long contexts by riffle-interleaving chunks from multiple similar-but-not-identical documents with weak delimiters — motivated by the rarity and distributional difference of long natural docs. Percy Liang [endorsed the idea](https://discord.com/channels/1354881461060243556/1380235124011958313/1507888954790117496) and suggested a more general recipe based on document graph traversal (topic similarity, version history, temporal proximity, citations, etc.). Issue [#5926](https://github.com/marin-community/marin/issues/5926) was filed.

## <#1483266366772351067> — Midtraining Experiments

Ahmed M Ahmed [shared](https://discord.com/channels/1354881461060243556/1483266366772351067/1507658133844263036) results from Delphi scaling ladder midtraining experiments at 20% token budget, published as [marimo notebooks](https://ahmeda14960.github.io/delphi-midtraining/?v=c86be93c). willheld [asked](https://discord.com/channels/1354881461060243556/1483266366772351067/1507819437636456498) about experiments where midtraining is done by simply changing the data mix during cooldown without other setting changes.

## News & Research

- [Open Athena: Scaling Laws That Extrapolate](https://discord.com/channels/1354881461060243556/1356487690559684638/1506290515660902504) — shared by Colin Raffel
- [ScheduleFree+: Scaling Learning-Rate-Free Optimizers](https://discord.com/channels/1354881461060243556/1356487690559684638/1506750234368282628) — shared by Matheart
- [A Bitter Lesson for Data Filtering](https://discord.com/channels/1354881461060243556/1356487690559684638/1507196804142465079) — shared by kloudy
- [Generalization Dynamics blog](https://jiaxin-wen.github.io/blog/generalization-dynamics) — shared by willheld
- [Cursor Composer 2.5 synthetic data blog](https://cursor.com/blog/composer-2-5#synthetic-data) — shared by elie
- [HRM-Text-1B](https://huggingface.co/sapientinc/HRM-Text-1B) and [PleIAs/SYNTH dataset](https://huggingface.co/datasets/PleIAs/SYNTH) — highlighted by Kaiyue-Wen
- Larry [noted interest](https://discord.com/channels/1354881461060243556/1356487690559684638/1507463121646784563) in a dynamic MoE routing approach (removing top-k requirement) related to null routing, shared by elie
- [MTOB: A Benchmark for Learning to Translate from One Grammar Book](https://github.com/lukemelas/mtob) — flagged by willheld for long-context eval
- Percy Liang shared a [trace synthesis paper](https://arxiv.org/abs/2510.08558) for SFT-RL middle ground
