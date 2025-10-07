from typing import List, Tuple

# Very simple deviation detection: keyword overlap vs agenda titles

def similarity(a: str, b: str) -> float:
    a_words = set(w for w in a.lower().split() if len(w) > 1)
    b_words = set(w for w in b.lower().split() if len(w) > 1)
    if not a_words or not b_words:
        return 0.0
    inter = len(a_words & b_words)
    union = len(a_words | b_words)
    return inter / union if union else 0.0


def check_deviation(text: str, agenda_titles: List[str], threshold: float = 0.3) -> Tuple[float, str, List[str]]:
    best = 0.0
    best_titles: List[str] = []
    for t in agenda_titles:
        s = similarity(text, t)
        if s > best:
            best = s
            best_titles = [t]
        elif s == best and s > 0:
            best_titles.append(t)
    label = "on_track" if best >= threshold else "possible_deviation"
    # If deviation, suggest top 2 agenda to return to
    scored = sorted([(similarity(text, t), t) for t in agenda_titles], reverse=True)
    targets = [t for _, t in scored[:2]]
    return best, label, targets
