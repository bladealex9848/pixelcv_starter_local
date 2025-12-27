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
    'chinese_checkers': {
        'easy': {
            'error_chance': 0.4,
            'max_depth': 2,
            'aggressive_factor': 0.5,
            'defensive_factor': 0.8
        },
        'medium': {
            'error_chance': 0.15,
            'max_depth': 3,
            'aggressive_factor': 0.7,
            'defensive_factor': 0.9
        },
        'hard': {
            'error_chance': 0.02,
            'max_depth': 4,
            'aggressive_factor': 0.9,
            'defensive_factor': 1.0
        },
        'expert': {
            'error_chance': 0.0,
            'max_depth': 5,
            'aggressive_factor': 1.0,
            'defensive_factor': 1.0
        },
    },
    'tron': {
        'easy': {
            'error_chance': 0.3,
            'evade_distance': 8,
            'space_calculation_depth': 50,
            'randomness': 0.4
        },
        'medium': {
            'error_chance': 0.15,
            'evade_distance': 5,
            'space_calculation_depth': 100,
            'randomness': 0.2
        },
        'hard': {
            'error_chance': 0.05,
            'evade_distance': 3,
            'space_calculation_depth': 150,
            'randomness': 0.1
        },
        'expert': {
            'error_chance': 0.0,
            'evade_distance': 2,
            'space_calculation_depth': 200,
            'randomness': 0.0
        },
    },
    'offroad4x4': {
        'easy': {
            'error_chance': 0.3,
            'look_ahead': 2,
            'turn_strength': 0.5,
            'throttle_power': 0.7,
            'avoidance_sensitivity': 0.6
        },
        'medium': {
            'error_chance': 0.15,
            'look_ahead': 3,
            'turn_strength': 0.8,
            'throttle_power': 0.8,
            'avoidance_sensitivity': 0.8
        },
        'hard': {
            'error_chance': 0.05,
            'look_ahead': 4,
            'turn_strength': 1.0,
            'throttle_power': 0.9,
            'avoidance_sensitivity': 1.0
        },
        'expert': {
            'error_chance': 0.0,
            'look_ahead': 5,
            'turn_strength': 1.2,
            'throttle_power': 1.0,
            'avoidance_sensitivity': 1.2
        },
    },
    'pacman': {
        'easy': {
            'error_chance': 0.3,
            'ghost_speed': 0.7,
            'frightened_duration': 10000,
            'chase_aggression': 0.5,
            'random_movement': 0.4
        },
        'medium': {
            'error_chance': 0.15,
            'ghost_speed': 0.8,
            'frightened_duration': 8000,
            'chase_aggression': 0.7,
            'random_movement': 0.2
        },
        'hard': {
            'error_chance': 0.05,
            'ghost_speed': 0.9,
            'frightened_duration': 6000,
            'chase_aggression': 0.9,
            'random_movement': 0.1
        },
        'expert': {
            'error_chance': 0.0,
            'ghost_speed': 1.0,
            'frightened_duration': 5000,
            'chase_aggression': 1.0,
            'random_movement': 0.0
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

    @staticmethod
    def get_chinese_checkers_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo Minimax para Damas Chinas con heurística de posición.

        Args:
            game_state: {
                board: [0-63] (0=empty, 1=R, 2=B),
                player: 'B' (IA)
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional)

        Returns:
            {
                from: Posición de origen,
                to: Posición de destino,
                strategy: 'minimax' o 'heuristic'
            }
        """
        # Obtener parámetros
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('chinese_checkers', difficulty)

        board = game_state.get('board', [0] * 64)
        player = game_state.get('player', 'B')

        # Convertir player a número (B=2, R=1)
        ai_player = 2 if player == 'B' else 1
        human_player = 3 - ai_player

        # 1. Decidir si usar Minimax perfecto o con error
        error_chance = parameters.get('error_chance', 0.15)
        use_perfect = random.random() > error_chance

        best_move = None
        strategy = 'heuristic'

        if use_perfect:
            # Usar Minimax con profundidad variable
            max_depth = parameters.get('max_depth', 3)
            best_move = GameAlgorithmService._minimax_chinese_checkers(
                board, ai_player, human_player, max_depth
            )
            strategy = 'minimax'
        else:
            # Usar heurística
            best_move = GameAlgorithmService._heuristic_move_chinese_checkers(
                board, ai_player, human_player, parameters
            )
            strategy = 'heuristic'

        return {
            'from': best_move['from'],
            'to': best_move['to'],
            'strategy': strategy
        }

    @staticmethod
    def _minimax_chinese_checkers(board: list, ai_player: int, human_player: int, depth: int) -> dict:
        """Algoritmo Minimax para Damas Chinas"""

        def minimax(board, depth, alpha, beta, is_maximizing):
            # Verificar terminal states
            winner = GameAlgorithmService._check_winner_chinese_checkers(board)
            if winner == ai_player:
                return 1000 + depth
            if winner == human_player:
                return -1000 - depth
            if depth == 0:
                return GameAlgorithmService._evaluate_board_chinese_checkers(board, ai_player, human_player)

            # Generar movimientos disponibles
            available_moves = GameAlgorithmService._generate_moves(board, ai_player if is_maximizing else human_player)

            if is_maximizing:
                max_eval = -math.inf
                for move in available_moves:
                    new_board = GameAlgorithmService._apply_move(board, move)
                    eval_score = minimax(new_board, depth - 1, alpha, beta, False)
                    max_eval = max(max_eval, eval_score)
                    alpha = max(alpha, eval_score)
                    if beta <= alpha:
                        break
                return max_eval
            else:
                min_eval = math.inf
                for move in available_moves:
                    new_board = GameAlgorithmService._apply_move(board, move)
                    eval_score = minimax(new_board, depth - 1, alpha, beta, True)
                    min_eval = min(min_eval, eval_score)
                    beta = min(beta, eval_score)
                    if beta <= alpha:
                        break
                return min_eval

        # Encontrar mejor movimiento
        available_moves = GameAlgorithmService._generate_moves(board, ai_player)
        if not available_moves:
            return {'from': 0, 'to': 0}

        best_move = available_moves[0]
        best_score = -math.inf

        for move in available_moves:
            new_board = GameAlgorithmService._apply_move(board, move)
            score = minimax(new_board, depth - 1, -math.inf, math.inf, False)

            if score > best_score:
                best_score = score
                best_move = move

        return best_move

    @staticmethod
    def _heuristic_move_chinese_checkers(board: list, ai_player: int, human_player: int, parameters: dict) -> dict:
        """Elige un movimiento basado en heurística simple"""
        available_moves = GameAlgorithmService._generate_moves(board, ai_player)

        if not available_moves:
            return {'from': 0, 'to': 0}

        # Priorizar capturas
        captures = [m for m in available_moves if len(m.get('captures', [])) > 0]
        if captures:
            return captures[0]

        # Priorizar movimientos hacia adelante
        forward_moves = []
        for move in available_moves:
            from_row = move['from'] // 8
            to_row = move['to'] // 8
            if ai_player == 2:  # Piezas azules van hacia arriba
                if to_row < from_row:
                    forward_moves.append(move)
            else:  # Piezas rojas van hacia abajo
                if to_row > from_row:
                    forward_moves.append(move)

        if forward_moves:
            return forward_moves[0]

        return available_moves[0]

    @staticmethod
    def _generate_moves(board: list, player: int) -> list:
        """Genera todos los movimientos posibles para el jugador"""
        moves = []

        for i in range(64):
            if board[i] == player:
                # Movimientos normales
                row, col = i // 8, i % 8
                for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    new_row, new_col = row + dr, col + dc
                    if 0 <= new_row < 8 and 0 <= new_col < 8:
                        new_index = new_row * 8 + new_col
                        if board[new_index] == 0:
                            moves.append({'from': i, 'to': new_index, 'captures': []})

                # Saltos
                jump_moves = GameAlgorithmService._get_jump_moves(board, i, player)
                moves.extend(jump_moves)

        return moves

    @staticmethod
    def _get_jump_moves(board: list, from_index: int, player: int) -> list:
        """Genera movimientos de salto desde una posición"""
        moves = []
        row, col = from_index // 8, from_index % 8

        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            mid_row, mid_col = row + dr, col + dc
            end_row, end_col = row + 2 * dr, col + 2 * dc

            if 0 <= end_row < 8 and 0 <= end_col < 8:
                mid_index = mid_row * 8 + mid_col
                end_index = end_row * 8 + end_col

                if (board[mid_index] and board[mid_index] != player and
                    board[end_index] == 0):
                    moves.append({
                        'from': from_index,
                        'to': end_index,
                        'captures': [mid_index]
                    })

        return moves

    @staticmethod
    def _apply_move(board: list, move: dict) -> list:
        """Aplica un movimiento al tablero"""
        new_board = board.copy()
        new_board[move['from']] = 0
        new_board[move['to']] = 1 if move['to'] < 8 else 2  # Simplificado
        for capture in move.get('captures', []):
            new_board[capture] = 0
        return new_board

    @staticmethod
    def _check_winner_chinese_checkers(board: list) -> int:
        """Verifica si hay ganador (llegó al lado opuesto)"""
        # Verificar piezas rojas (1) en fila superior
        for i in range(8):
            if board[i] == 1:
                return 1

        # Verificar piezas azules (2) en fila inferior
        for i in range(56, 64):
            if board[i] == 2:
                return 2

        return 0

    @staticmethod
    def _evaluate_board_chinese_checkers(board: list, ai_player: int, human_player: int) -> int:
        """Evalúa el tablero para heurística"""
        score = 0

        # Calcular distancia promedio hacia el objetivo
        ai_distance = 0
        ai_count = 0
        human_distance = 0
        human_count = 0

        for i in range(64):
            if board[i] == ai_player:
                row = i // 8
                if ai_player == 2:  # Azules van hacia arriba
                    ai_distance += row
                else:  # Rojas van hacia abajo
                    ai_distance += (7 - row)
                ai_count += 1
            elif board[i] == human_player:
                row = i // 8
                if human_player == 2:
                    human_distance += row
                else:
                    human_distance += (7 - row)
                human_count += 1

        if ai_count > 0:
            avg_ai_distance = ai_distance / ai_count
            score += (7 - avg_ai_distance) * 10  # Preferir estar más cerca

        if human_count > 0:
            avg_human_distance = human_distance / human_count
            score -= (7 - avg_human_distance) * 10

        return score

    @staticmethod
    def get_tron_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo de pathfinding para Tron con A* y evasión de obstáculos.

        Args:
            game_state: {
                grid: [[0-2]] (0=empty, 1=player_trail, 2=ai_trail),
                ai_position: {'x': int, 'y': int},
                player_position: {'x': int, 'y': int}
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional)

        Returns:
            {
                direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
                strategy: 'pathfinding' | 'evade' | 'random'
            }
        """
        import random

        # Obtener parámetros
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('tron', difficulty)

        grid = game_state.get('grid', [])
        ai_pos = game_state.get('ai_position', {'x': 0, 'y': 0})
        player_pos = game_state.get('player_position', {'x': 0, 'y': 0})

        if not grid:
            return {'direction': 'RIGHT', 'strategy': 'random'}

        # Obtener dimensiones del grid
        height = len(grid)
        width = len(grid[0]) if height > 0 else 0

        # Verificar movimientos posibles
        possible_moves = []
        directions = ['UP', 'DOWN', 'LEFT', 'RIGHT']
        deltas = {'UP': (0, -1), 'DOWN': (0, 1), 'LEFT': (-1, 0), 'RIGHT': (1, 0)}

        for direction in directions:
            dx, dy = deltas[direction]
            new_x, new_y = ai_pos['x'] + dx, ai_pos['y'] + dy

            # Verificar límites
            if 0 <= new_x < width and 0 <= new_y < height:
                # Verificar colisión
                if grid[new_y][new_x] == 0:  # Empty
                    possible_moves.append({
                        'direction': direction,
                        'position': {'x': new_x, 'y': new_y}
                    })

        if not possible_moves:
            # Sin movimientos posibles - continuar en la misma dirección (será una colisión)
            return {'direction': 'RIGHT', 'strategy': 'random'}

        # Calcular distancia al jugador
        distance_to_player = abs(player_pos['x'] - ai_pos['x']) + abs(player_pos['y'] - ai_pos['y'])

        # Estrategia 1: Evasión (si el jugador está cerca)
        if distance_to_player < 5:
            evade_move = GameAlgorithmService._tron_evade_player(
                possible_moves, ai_pos, player_pos, grid
            )
            if evade_move:
                return {'direction': evade_move['direction'], 'strategy': 'evade'}

        # Estrategia 2: Pathfinding A* (maximizar espacio disponible)
        best_move = None
        max_space = -1

        for move in possible_moves:
            space = GameAlgorithmService._tron_calculate_space(
                move['position'], grid, width, height
            )
            if space > max_space:
                max_space = space
                best_move = move

        if best_move:
            return {'direction': best_move['direction'], 'strategy': 'pathfinding'}

        # Fallback: movimiento aleatorio
        return {'direction': random.choice(possible_moves)['direction'], 'strategy': 'random'}

    @staticmethod
    def _tron_evade_player(possible_moves: list, ai_pos: dict, player_pos: dict, grid: list) -> dict:
        """Elegir movimiento que maximice la distancia al jugador"""
        best_move = None
        max_distance = -1

        for move in possible_moves:
            distance = abs(player_pos['x'] - move['position']['x']) + abs(player_pos['y'] - move['position']['y'])
            if distance > max_distance:
                max_distance = distance
                best_move = move

        return best_move

    @staticmethod
    def _tron_calculate_space(position: dict, grid: list, width: int, height: int) -> int:
        """Calcular espacio disponible desde una posición usando flood fill"""
        visited = set()
        queue = [position]
        space = 0

        while queue and space < 200:  # Límite para performance
            current = queue.pop(0)
            key = f"{current['x']},{current['y']}"

            if key in visited:
                continue
            visited.add(key)

            # Verificar las 4 direcciones
            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                new_x, new_y = current['x'] + dx, current['y'] + dy

                if (0 <= new_x < width and 0 <= new_y < height and
                    grid[new_y][new_x] == 0):  # Empty cell
                    new_pos = {'x': new_x, 'y': new_y}
                    new_key = f"{new_x},{new_y}"
                    if new_key not in visited:
                        queue.append(new_pos)
                        space += 1

        return space

    @staticmethod
    def get_offroad4x4_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo A* pathfinding para 4x4 Off-Road con evasión de obstáculos.

        Args:
            game_state: {
                vehicle: {'x': int, 'y': int, 'angle': float},
                checkpoints: [{'x': int, 'y': int}],
                current_checkpoint: int,
                terrain: [[0-3]] (0=easy, 1=normal, 2=obstacle, 3=checkpoint)
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional)

        Returns:
            {
                throttle: -1 to 1,
                turn: -1 to 1,
                strategy: 'pathfinding' | 'avoid' | 'direct'
            }
        """
        import random
        import math

        # Obtener parámetros
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('offroad4x4', difficulty)

        vehicle = game_state.get('vehicle', {'x': 0, 'y': 0, 'angle': 0})
        checkpoints = game_state.get('checkpoints', [])
        current_checkpoint = game_state.get('current_checkpoint', 0)
        terrain = game_state.get('terrain', [])

        if not checkpoints or current_checkpoint >= len(checkpoints):
            return {'throttle': 0, 'turn': 0, 'strategy': 'direct'}

        # Obtener checkpoint objetivo
        target = checkpoints[current_checkpoint]
        target_x = target['x']
        target_y = target['y']

        # Calcular ángulo hacia el checkpoint
        dx = target_x - vehicle['x']
        dy = target_y - vehicle['y']
        target_angle = math.atan2(dy, dx)

        # Calcular diferencia de ángulo
        angle_diff = target_angle - vehicle['angle']
        while angle_diff > math.pi:
            angle_diff -= 2 * math.pi
        while angle_diff < -math.pi:
            angle_diff += 2 * math.pi

        # Recolectar movimiento de IA
        movesRef = game_state.get('moves_ref', [])
        if movesRef is not None:
            import time
            movesRef.append({
                'position': {'x': vehicle['x'], 'y': vehicle['y']},
                'timestamp': int(time.time() * 1000),
                'terrain_state': terrain,
                'checkpoint_reached': current_checkpoint
            })

        # Verificar obstáculos adelante
        look_ahead_distance = parameters.get('look_ahead', 3)
        check_x = vehicle['x'] + math.cos(vehicle['angle']) * look_ahead_distance
        check_y = vehicle['y'] + math.sin(vehicle['angle']) * look_ahead_distance

        # Verificar colisión
        if GameAlgorithmService._offroad4x4_check_collision(check_x, check_y, terrain):
            # Obstáculo adelante - girar para evitar
            return {
                'throttle': 0.5,
                'turn': angle_diff > 0 and random.random() > 0.5 or angle_diff < 0 and random.random() < 0.5,
                'strategy': 'avoid'
            }

        # Normal - dirigir hacia el checkpoint
        turn_strength = parameters.get('turn_strength', 1.0)
        throttle_power = parameters.get('throttle_power', 1.0)

        return {
            'throttle': throttle_power,
            'turn': max(-1, min(1, angle_diff * turn_strength)),
            'strategy': 'pathfinding'
        }

    @staticmethod
    def _offroad4x4_check_collision(x: float, y: float, terrain: list) -> bool:
        """Verificar colisión con obstáculos en el terreno"""
        grid_width = 40
        grid_height = 30
        cell_size = 20

        cell_x = int(x / cell_size)
        cell_y = int(y / cell_size)

        if cell_x < 0 or cell_x >= grid_width or cell_y < 0 or cell_y >= grid_height:
            return True

        if cell_y < len(terrain) and cell_x < len(terrain[cell_y]):
            return terrain[cell_y][cell_x] == 2  # 2 = obstacle

        return False

    @staticmethod
    def get_pacman_move(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
        """
        Algoritmo multi-agent para Pac-Man con IA para fantasmas.

        Args:
            game_state: {
                grid: [[0-5]] (0=empty, 1=wall, 2=dot, 3=power_pellet, 4=ghost, 5=pacman),
                pacman: {'x': int, 'y': int, 'direction': str},
                ghosts: [{'x': int, 'y': int, 'mode': str, 'color': str}],
                power_pellet_active: bool
            }
            difficulty: easy, medium, hard, expert
            parameters: Parámetros personalizados (opcional)

        Returns:
            {
                ghost_moves: [{'x': int, 'y': int, 'direction': str}],
                strategy: 'multi_agent' | 'simple'
            }
        """
        # Obtener parámetros
        if parameters is None:
            parameters = GameAlgorithmService.get_default_parameters('pacman', difficulty)

        grid = game_state.get('grid', [])
        pacman = game_state.get('pacman', {'x': 0, 'y': 0, 'direction': 'NONE'})
        ghosts = game_state.get('ghosts', [])

        if not grid or not ghosts:
            return {'ghost_moves': [], 'strategy': 'simple'}

        # Recolectar movimientos de IA
        movesRef = game_state.get('moves_ref', [])
        if movesRef is not None:
            import time
            movesRef.append({
                'position': {'x': pacman['x'], 'y': pacman['y']},
                'timestamp': int(time.time() * 1000),
                'terrain_state': grid,
                'ghost_positions': [{'x': g['x'], 'y': g['y']} for g in ghosts],
                'power_pellet_active': game_state.get('power_pellet_active', False)
            })

        # Calcular movimientos para cada fantasma
        ghost_moves = []
        chase_aggression = parameters.get('chase_aggression', 0.7)
        random_movement = parameters.get('random_movement', 0.2)

        for i, ghost in enumerate(ghosts):
            # Determinar objetivo del fantasma
            target_x = pacman['x']
            target_y = pacman['y']

            # En modo frightened, huir de Pac-Man
            if ghost.get('mode') == 'frightened':
                # Calcular dirección opuesta a Pac-Man
                dx = ghost['x'] - pacman['x']
                dy = ghost['y'] - pacman['y']
                if abs(dx) > abs(dy):
                    target_x = ghost['x'] + (1 if dx > 0 else -1) * 5
                else:
                    target_y = ghost['y'] + (1 if dy > 0 else -1) * 5

            # Verificar movimientos posibles
            possible_moves = []
            directions = ['UP', 'DOWN', 'LEFT', 'RIGHT']
            for direction in directions:
                dx = 0
                dy = 0
                if direction == 'UP':
                    dy = -1
                elif direction == 'DOWN':
                    dy = 1
                elif direction == 'LEFT':
                    dx = -1
                elif direction == 'RIGHT':
                    dx = 1

                new_x = ghost['x'] + dx
                new_y = ghost['y'] + dy

                if (0 <= new_x < len(grid[0]) and 0 <= new_y < len(grid) and
                    grid[new_y][new_x] != 1):  # No es pared
                    possible_moves.append({
                        'direction': direction,
                        'x': new_x,
                        'y': new_y
                    })

            # Elegir mejor movimiento
            if possible_moves:
                if random.random() < random_movement:
                    # Movimiento aleatorio
                    best_move = possible_moves[random.randint(0, len(possible_moves) - 1)]
                else:
                    # Buscar el movimiento que minimize la distancia al objetivo
                    best_move = possible_moves[0]
                    best_distance = abs(best_move['x'] - target_x) + abs(best_move['y'] - target_y)

                    for move in possible_moves:
                        distance = abs(move['x'] - target_x) + abs(move['y'] - target_y)
                        if distance < best_distance:
                            best_distance = distance
                            best_move = move

                ghost_moves.append({
                    'x': best_move['x'],
                    'y': best_move['y'],
                    'direction': best_move['direction']
                })
            else:
                ghost_moves.append({
                    'x': ghost['x'],
                    'y': ghost['y'],
                    'direction': 'NONE'
                })

        return {
            'ghost_moves': ghost_moves,
            'strategy': 'multi_agent'
        }


# Funciones de conveniencia para compatibilidad con código existente
def get_pong_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_pong_move (compatibilidad)"""
    return GameAlgorithmService.get_pong_move(game_state, difficulty, parameters)


def get_tictactoe_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_tictactoe_move (compatibilidad)"""
    return GameAlgorithmService.get_tictactoe_move(game_state, difficulty, parameters)


def get_chinese_checkers_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_chinese_checkers_move (compatibilidad)"""
    return GameAlgorithmService.get_chinese_checkers_move(game_state, difficulty, parameters)

def get_tron_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_tron_move (compatibilidad)"""
    return GameAlgorithmService.get_tron_move(game_state, difficulty, parameters)

def get_offroad4x4_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_offroad4x4_move (compatibilidad)"""
    return GameAlgorithmService.get_offroad4x4_move(game_state, difficulty, parameters)

def get_pacman_move_local(game_state: dict, difficulty: str = 'medium', parameters: Optional[dict] = None) -> dict:
    """Wrapper para get_pacman_move (compatibilidad)"""
    return GameAlgorithmService.get_pacman_move(game_state, difficulty, parameters)
