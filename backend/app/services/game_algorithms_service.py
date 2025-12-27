# -*- coding: utf-8 -*-
"""Servicio de algoritmos locales para IA de juegos (sin llamadas en tiempo real a Ollama)

Este servicio reemplaza las llamadas en tiempo real a Ollama por algoritmos predictivos
locales que usan parámetros configurables. Los parámetros se mejoran offline mediante
análisis de IA de partidas completadas.
"""
import random
import math
from typing import Optional


# Parámetros por defecto para cada juego y dificultad
# Estos se usan si no hay parámetros en la base de datos
DEFAULT_PARAMETERS = {
    'pong': {
        'easy': {
            'base_error': 50.0,
            'reaction_delay_chance': 0.2,
            'max_bounces': 1,
            'paddle_speed': 4.0,
            'strategy': 'defensive'
        },
        'medium': {
            'base_error': 20.0,
            'reaction_delay_chance': 0.05,
            'max_bounces': 2,
            'paddle_speed': 6.0,
            'strategy': 'balanced'
        },
        'hard': {
            'base_error': 5.0,
            'reaction_delay_chance': 0.01,
            'max_bounces': 3,
            'paddle_speed': 8.0,
            'strategy': 'balanced'
        },
        'expert': {
            'base_error': 0.0,
            'reaction_delay_chance': 0.0,
            'max_bounces': 5,
            'paddle_speed': 10.0,
            'strategy': 'aggressive'
        },
    },
    'tictactoe': {
        'easy': {
            'error_chance': 0.4,
            'max_depth': 2,
            'position_weights': [2, 1, 2, 1, 3, 1, 2, 1, 2]  # Centro poco valioso
        },
        'medium': {
            'error_chance': 0.15,
            'max_depth': 4,
            'position_weights': [3, 2, 3, 2, 4, 2, 3, 2, 3]  # Centro valioso
        },
        'hard': {
            'error_chance': 0.02,
            'max_depth': 6,
            'position_weights': [3, 2, 3, 2, 4, 2, 3, 2, 3]
        },
        'expert': {
            'error_chance': 0.0,
            'max_depth': 9,
            'position_weights': [3, 2, 3, 2, 4, 2, 3, 2, 3]
        },
    },
}


class GameAlgorithmService:
    """Servicio unificado de algoritmos locales para IA de juegos

    Todos los algoritmos funcionan SIN llamadas HTTP a Ollama, eliminando
    timeouts y latencia durante gameplay.
    """

    @staticmethod
    def get_default_parameters(game_id: str, difficulty: str = 'medium') -> dict:
        """Retorna parámetros por defecto para un juego y dificultad"""
        return DEFAULT_PARAMETERS.get(game_id, {}).get(
            difficulty,
            DEFAULT_PARAMETERS.get(game_id, {}).get('medium', {})
        )

    @staticmethod
    def get_pong_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo predictivo para Pong con física realista.

        Args:
            game_state: {
                ball_x, ball_y, ball_vx, ball_vy,
                paddle_y, paddle_height,
                canvas_width, canvas_height,
                last_predicted_y (opcional)
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional, usa default si no se proporciona)

        Returns:
            {
                target_y: Posición objetivo de la paleta,
                predicted_y: Posición predicha de la pelota,
                confidence: Confianza de la predicción (0-1)
            }
        """
        # Obtener parámetros (usar los proporcionados o defaults)
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('pong', difficulty)

        # Extraer estado del juego
        ball_x = game_state.get('ball_x', 400)
        ball_y = game_state.get('ball_y', 250)
        ball_vx = game_state.get('ball_vx', 5)
        ball_vy = game_state.get('ball_vy', 3)
        canvas_width = game_state.get('canvas_width', 800)
        canvas_height = game_state.get('canvas_height', 500)
        paddle_height = game_state.get('paddle_height', 100)
        paddle_y = game_state.get('paddle_y', 200)

        # 1. Calcular posición de intersección con física
        predicted_y = GameAlgorithmService._predict_ball_intersection(
            ball_x, ball_y, ball_vx, ball_vy,
            canvas_width, canvas_height,
            max_bounces=parameters.get('max_bounces', 2)
        )

        # 2. Agregar error controlado (según dificultad)
        base_error = parameters.get('base_error', 20.0)
        error_range = base_error * parameters.get('difficulty_multiplier', 1.0)
        predicted_y += random.uniform(-error_range, error_range)

        # 3. Aplicar delay de reacción simulado
        # A veces usa la predicción anterior en lugar de la actual
        if random.random() < parameters.get('reaction_delay_chance', 0.05):
            predicted_y = game_state.get('last_predicted_y', predicted_y)

        # 4. Calcular target Y (centro de la paleta)
        target_y = predicted_y - paddle_height / 2

        # 5. Ajustar según estrategia
        strategy = parameters.get('strategy', 'balanced')
        if strategy == 'aggressive':
            # Posicionarse para golpear con ángulo (un poco off-center)
            target_y += parameters.get('aggressive_offset', 15)
        elif strategy == 'defensive':
            # Mantener paleta más centrada
            target_y = target_y * 0.9 + canvas_height / 2 * 0.1

        # 6. Mantener dentro de límites
        target_y = max(0, min(canvas_height - paddle_height, target_y))

        # 7. Calcular confianza basada en error
        confidence = max(0.0, min(1.0, 1.0 - (base_error / 100.0)))

        return {
            'target_y': target_y,
            'predicted_y': predicted_y,
            'confidence': confidence
        }

    @staticmethod
    def _predict_ball_intersection(
        ball_x: float, ball_y: float,
        ball_vx: float, ball_vy: float,
        canvas_width: float, canvas_height: float,
        max_bounces: int = 3
    ) -> float:
        """
        Predice dónde estará la pelota cuando llegue al lado derecho del canvas.

        Simula rebotes en top/bottom hasta max_bounces veces.
        """
        # Si la pelota se mueve hacia la izquierda, no necesita predecir
        if ball_vx < 0:
            return ball_y

        # Calcular tiempo para llegar al lado derecho
        distance = canvas_width - ball_x
        time_to_edge = distance / ball_vx if ball_vx > 0 else 0

        # Calcular posición Y sin rebotes
        predicted_y = ball_y + ball_vy * time_to_edge

        # Simular rebotes
        bounces = 0
        while bounces < max_bounces:
            # Si está dentro de límites, terminar
            if 0 <= predicted_y <= canvas_height:
                break

            # Calcular rebote
            if predicted_y < 0:
                # Reborde superior
                predicted_y = -predicted_y
            elif predicted_y > canvas_height:
                # Reborde inferior
                predicted_y = 2 * canvas_height - predicted_y

            bounces += 1

        return predicted_y

    @staticmethod
    def get_tictactoe_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo Minimax con profundidad dinámica para Tic Tac Toe.

        Args:
            game_state: {
                board: [0-8] (0=empty, 1=X, 2=O),
                player: 'X' o 'O'
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional)

        Returns:
            {
                position: Posición elegida (0-8),
                strategy: 'minimax' o 'heuristic'
            }
        """
        # Obtener parámetros
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('tictactoe', difficulty)

        board = game_state.get('board', [0] * 9)
        player = game_state.get('player', 'O')

        # Convertir player a número (O=2, X=1)
        ai_player = 2 if player == 'O' else 1
        human_player = 3 - ai_player  # 1 si AI es 2, 2 si AI es 1

        # 1. Decidir si usar Minimax perfecto o con error
        error_chance = parameters.get('error_chance', 0.15)
        use_perfect = random.random() > error_chance

        position = -1
        strategy = 'heuristic'

        if use_perfect:
            # Usar Minimax con profundidad variable
            max_depth = parameters.get('max_depth', 4)
            position = GameAlgorithmService._minimax_tictactoe(
                board, ai_player, human_player, max_depth
            )
            strategy = 'minimax'
        else:
            # Usar heurística con pesos de posición
            position_weights = parameters.get('position_weights', [3, 2, 3, 2, 4, 2, 3, 2, 3])
            position = GameAlgorithmService._weighted_random_move(board, position_weights)
            strategy = 'heuristic'

        return {
            'position': position,
            'strategy': strategy
        }

    @staticmethod
    def _minimax_tictactoe(board: list, ai_player: int, human_player: int, depth: int) -> int:
        """Algoritmo Minimax para Tic Tac Toe con poda alpha-beta"""

        def minimax(board, depth, alpha, beta, is_maximizing):
            # Verificar terminal states
            winner = GameAlgorithmService._check_winner(board)
            if winner == ai_player:
                return 1000 + depth  # Preferir ganar rápido
            if winner == human_player:
                return -1000 - depth  # Preferir perder lento
            if 0 not in board:
                return 0  # Empate
            if depth == 0:
                return GameAlgorithmService._evaluate_board(board, ai_player, human_player)

            # Generar movimientos disponibles
            available = [i for i in range(9) if board[i] == 0]

            if is_maximizing:
                max_eval = -math.inf
                for move in available:
                    board[move] = ai_player
                    eval_score = minimax(board, depth - 1, alpha, beta, False)
                    board[move] = 0
                    max_eval = max(max_eval, eval_score)
                    alpha = max(alpha, eval_score)
                    if beta <= alpha:
                        break
                return max_eval
            else:
                min_eval = math.inf
                for move in available:
                    board[move] = human_player
                    eval_score = minimax(board, depth - 1, alpha, beta, True)
                    board[move] = 0
                    min_eval = min(min_eval, eval_score)
                    beta = min(beta, eval_score)
                    if beta <= alpha:
                        break
                return min_eval

        # Encontrar mejor movimiento
        available = [i for i in range(9) if board[i] == 0]
        if not available:
            return 0  # No hay movimientos

        best_move = available[0]
        best_score = -math.inf

        for move in available:
            board[move] = ai_player
            score = minimax(board, depth - 1, -math.inf, math.inf, False)
            board[move] = 0

            if score > best_score:
                best_score = score
                best_move = move

        return best_move

    @staticmethod
    def _weighted_random_move(board: list, weights: list) -> int:
        """Elige un movimiento aleatorio ponderado por pesos de posición"""
        available = [(i, weights[i]) for i in range(9) if board[i] == 0]

        if not available:
            return 0

        # Ordenar por peso (mayor primero)
        available.sort(key=lambda x: x[1], reverse=True)

        # Elegir basado en pesos (probabilidad proporcional al peso)
        total_weight = sum(w for _, w in available)
        rand_val = random.uniform(0, total_weight)

        cumulative = 0
        for position, weight in available:
            cumulative += weight
            if rand_val <= cumulative:
                return position

        return available[0][0]

    @staticmethod
    def _check_winner(board: list) -> int:
        """Retorna el ganador (1, 2) o 0 si no hay ganador"""
        winning_combos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  # filas
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  # columnas
            [0, 4, 8], [2, 4, 6]              # diagonales
        ]

        for combo in winning_combos:
            values = [board[i] for i in combo]
            if values[0] != 0 and values[0] == values[1] == values[2]:
                return values[0]

        return 0

    @staticmethod
    def _evaluate_board(board: list, ai_player: int, human_player: int) -> int:
        """Evalúa el tablero para heurística"""
        winner = GameAlgorithmService._check_winner(board)
        if winner == ai_player:
            return 100
        if winner == human_player:
            return -100

        # Evaluar posiciones
        score = 0
        center = board[4]
        if center == ai_player:
            score += 10
        elif center == human_player:
            score -= 10

        # Esquinas
        corners = [0, 2, 6, 8]
        ai_corners = sum(1 for c in corners if board[c] == ai_player)
        human_corners = sum(1 for c in corners if board[c] == human_player)
        score += (ai_corners - human_corners) * 3

        return score


# Funciones de conveniencia para compatibilidad con código existente
def get_pong_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_pong_move (compatibilidad)"""
    return GameAlgorithmService.get_pong_move(game_state, difficulty, parameters)


def get_tictactoe_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_tictactoe_move (compatibilidad)"""
    return GameAlgorithmService.get_tictactoe_move(game_state, difficulty, parameters)
