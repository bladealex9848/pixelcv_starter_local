# -*- coding: utf-8 -*-
"""Servicio de IA para juegos usando Ollama con fallback local."""
import os
import requests
import random

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api")
# Modelos rápidos para juegos (en orden de preferencia según disponibilidad en el VPS)
# Modelos reales disponibles: qwen3:0.6b, qwen3:1.7b, gemma3:1b, granite3.3:2b
FAST_MODELS = ["qwen3:0.6b", "qwen3:1.7b", "gemma3:1b", "granite3.3:2b"]
GAME_AI_TIMEOUT = 2  # 2 segundos máximo para mantener el juego fluido


def get_ollama_move(game_type: str, game_state: dict) -> dict:
    """
    Obtiene un movimiento de IA desde Ollama para un juego.
    Retorna un diccionario con el movimiento o None si falla.

    game_type puede ser: 'pong', 'tictactoe', 'spaceinvaders'
    game_state contiene el estado actual del juego
    """
    # Seleccionar el primer modelo disponible
    available_models = _get_available_models()
    if not available_models:
        return None

    model = available_models[0]

    if game_type == 'pong':
        return _get_pong_move(game_state, model)
    elif game_type == 'tictactoe':
        return _get_tictactoe_move(game_state, model)
    elif game_type == 'spaceinvaders':
        return _get_spaceinvaders_move(game_state, model)

    return None


def _get_available_models() -> list[str]:
    """Retorna la lista de modelos disponibles, filtrados por los modelos rápidos."""
    try:
        resp = requests.get(f"{OLLAMA_BASE}/tags", timeout=3)
        resp.raise_for_status()
        data = resp.json()
        installed = [m["name"] for m in data.get("models", [])]

        # Retornar modelos rápidos que estén instalados
        for fast_model in FAST_MODELS:
            if any(installed.startswith(fast_model.split(':')[0]) for installed in installed):
                return [fast_model]

        # Si no hay modelos rápidos, usar el primero disponible
        return installed[:1] if installed else []
    except Exception as e:
        print(f"[GameAI] Error verificando modelos: {e}")
        return []


def _get_pong_move(game_state: dict, model: str) -> dict:
    """
    Obtiene movimiento de IA para Pong.
    game_state: {ball_x, ball_y, ball_vx, ball_vy, paddle_y, paddle_height, canvas_height}
    """
    ball_x = game_state.get('ball_x', 400)
    ball_y = game_state.get('ball_y', 250)
    paddle_y = game_state.get('paddle_y', 200)

    # Estrategia simple: predecir dónde estará la pelota
    target_y = ball_y - game_state.get('paddle_height', 100) / 2

    # Agregar aleatoriedad para que sea jugable
    target_y += random.randint(-30, 30)

    # Usar Ollama para ajustar la predicción (opcional, con timeout corto)
    try:
        prompt = f"""Pong game: Ball at ({ball_x},{ball_y}) moving toward paddle. Paddle center at {paddle_y + 50}.
Respond with ONLY a number between -50 and 50 indicating how many pixels to move (negative=up, positive=down)."""

        resp = requests.post(
            f"{OLLAMA_BASE}/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=GAME_AI_TIMEOUT
        )
        resp.raise_for_status()
        data = resp.json()
        response = data.get("response", "").strip()

        # Intentar extraer número
        import re
        match = re.search(r'-?\d+', response)
        if match:
            adjustment = int(match.group())
            target_y += max(-50, min(50, adjustment))
    except:
        pass  # Fallback al cálculo local

    return {"target_y": max(0, min(game_state.get('canvas_height', 500) - 100, target_y))}


def _get_tictactoe_move(game_state: dict, model: str) -> dict:
    """
    Obtiene movimiento de IA para Tic Tac Toe.
    game_state: {board: [0-8], player: 'X'|'O'}
    """
    board = game_state.get('board', [0] * 9)
    player = game_state.get('player', 'O')

    # Convertir board a formato string
    board_str = ""
    for i, cell in enumerate(board):
        if cell == 'X': board_str += "X"
        elif cell == 'O': board_str += "O"
        else: board_str += str(i)

    # Estrategia local fallback (minimax simplificado)
    best_move = _minimax_tictactoe(board, player)

    # Intentar mejorar con Ollama
    try:
        prompt = f"""Tic Tac Toe: You are {player}. Board (0-8, X=opponent, O=you, numbers=empty):
{board_str}
Respond with ONLY a single digit (0-8) for your best move."""

        resp = requests.post(
            f"{OLLAMA_BASE}/generate",
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=GAME_AI_TIMEOUT
        )
        resp.raise_for_status()
        data = resp.json()
        response = data.get("response", "").strip()

        # Extraer dígito
        import re
        match = re.search(r'[0-8]', response)
        if match:
            move = int(match.group())
            if board[move] == 0:  # Movimiento válido
                return {"position": move}
    except:
        pass

    return {"position": best_move}


def _minimax_tictactoe(board: list, player: str) -> int:
    """Minimax simplificado para Tic Tac Toe (fallback local)"""
    # Buscar movimientos ganadores
    winning_combos = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]

    # Verificar si podemos ganar
    for combo in winning_combos:
        cells = [board[i] for i in combo]
        if cells.count(player) == 2 and cells.count(0) == 1:
            return combo[cells.index(0)]

    # Bloquear al oponente
    opponent = 'X' if player == 'O' else 'O'
    for combo in winning_combos:
        cells = [board[i] for i in combo]
        if cells.count(opponent) == 2 and cells.count(0) == 1:
            return combo[cells.index(0)]

    # Centro si está disponible
    if board[4] == 0:
        return 4

    # Esquina aleatoria
    corners = [0, 2, 6, 8]
    available = [i for i in corners if board[i] == 0]
    if available:
        return random.choice(available)

    # Cualquier movimiento disponible
    available = [i for i in range(9) if board[i] == 0]
    return random.choice(available) if available else 0


def _get_spaceinvaders_move(game_state: dict, model: str) -> dict:
    """
    Obtiene movimiento de IA para Space Invaders (enemigos).
    game_state: {enemies: [{x,y}], player_x, direction}
    """
    enemies = game_state.get('enemies', [])
    direction = game_state.get('direction', 1)

    # Movimiento simple con posible ajuste de IA
    should_drop = False

    # Verificar si algún enemigo tocó el borde
    for enemy in enemies:
        if enemy.get('x', 0) <= 0 or enemy.get('x', 0) >= 560:
            should_drop = True
            break

    if should_drop:
        return {"action": "drop", "direction": -direction}

    return {"action": "move", "direction": direction}


def check_ollama_health() -> bool:
    """Verifica si Ollama está disponible y responde."""
    try:
        resp = requests.get(f"{OLLAMA_BASE}/tags", timeout=2)
        return resp.status_code == 200
    except:
        return False
