# -*- coding: utf-8 -*-
"""
Servicio Multi-Proveedor de IA para PixelCV
Soporta: Ollama, OpenRouter, Groq, DeepSeek, Together, DeepInfra, Mistral
"""
import os
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class AIProvider(Enum):
    OLLAMA = "ollama"
    OPENROUTER = "openrouter"
    GROQ = "groq"
    DEEPSEEK = "deepseek"
    TOGETHER = "together"
    DEEPINFRA = "deepinfra"
    MISTRAL = "mistral"


@dataclass
class ProviderConfig:
    """Configuración de un proveedor de IA"""
    name: str
    base_url: str
    api_key: Optional[str]
    default_model: str
    timeout: int = 60


class MultiAIService:
    """Servicio unificado para múltiples proveedores de IA"""

    # Modelos recomendados por proveedor para tareas de formato estructurado
    RECOMMENDED_MODELS = {
        AIProvider.OLLAMA: ["phi3.5:latest", "gemma3:1b", "qwen3:1.7b"],
        AIProvider.OPENROUTER: [
            "meta-llama/llama-3.3-70b-instruct:free",
            "nvidia/nemotron-nano-9b-v2:free",
        ],
        AIProvider.GROQ: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
        AIProvider.DEEPSEEK: ["deepseek-chat", "deepseek-reasoner"],
        AIProvider.TOGETHER: [
            "Qwen/Qwen2.5-72B-Instruct-Turbo",
            "meta-llama/Llama-3.2-3B-Instruct-Turbo",
        ],
        AIProvider.DEEPINFRA: ["nvidia/Llama-3.3-Nemotron-Super-49B-v1.5"],
        AIProvider.MISTRAL: ["mistral-small-latest"],
    }

    def __init__(self):
        self.providers = self._load_providers()

    def _load_providers(self) -> Dict[AIProvider, ProviderConfig]:
        """Carga la configuración de todos los proveedores desde variables de entorno"""
        providers = {}

        # Ollama
        if os.getenv("OLLAMA_BASE_URL"):
            providers[AIProvider.OLLAMA] = ProviderConfig(
                name="Ollama",
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api"),
                api_key=None,
                default_model=os.getenv("OLLAMA_DEFAULT_MODEL", "phi3.5:latest"),
                timeout=int(os.getenv("OLLAMA_TIMEOUT", "60")),
            )

        # OpenRouter
        if os.getenv("OPENROUTER_API_KEY"):
            providers[AIProvider.OPENROUTER] = ProviderConfig(
                name="OpenRouter",
                base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
                api_key=os.getenv("OPENROUTER_API_KEY"),
                default_model="meta-llama/llama-3.3-70b-instruct:free",
                timeout=120,
            )

        # Groq
        if os.getenv("GROQ_API_KEY"):
            providers[AIProvider.GROQ] = ProviderConfig(
                name="Groq",
                base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
                api_key=os.getenv("GROQ_API_KEY"),
                default_model="llama-3.3-70b-versatile",
                timeout=60,
            )

        # DeepSeek
        if os.getenv("DEEPSEEK_API_KEY"):
            providers[AIProvider.DEEPSEEK] = ProviderConfig(
                name="DeepSeek",
                base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                default_model="deepseek-chat",
                timeout=90,
            )

        # Together
        if os.getenv("TOGETHER_API_KEY"):
            providers[AIProvider.TOGETHER] = ProviderConfig(
                name="Together",
                base_url=os.getenv("TOGETHER_BASE_URL", "https://api.together.xyz/v1"),
                api_key=os.getenv("TOGETHER_API_KEY"),
                default_model="Qwen/Qwen2.5-72B-Instruct-Turbo",
                timeout=90,
            )

        # DeepInfra
        if os.getenv("DEEPINFRA_API_KEY"):
            providers[AIProvider.DEEPINFRA] = ProviderConfig(
                name="DeepInfra",
                base_url=os.getenv("DEEPINFRA_BASE_URL", "https://api.deepinfra.com/v1/openai"),
                api_key=os.getenv("DEEPINFRA_API_KEY"),
                default_model="nvidia/Llama-3.3-Nemotron-Super-49B-v1.5",
                timeout=90,
            )

        # Mistral
        if os.getenv("MISTRAL_API_KEY"):
            providers[AIProvider.MISTRAL] = ProviderConfig(
                name="Mistral",
                base_url=os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai/v1"),
                api_key=os.getenv("MISTRAL_API_KEY"),
                default_model="mistral-small-latest",
                timeout=60,
            )

        return providers

    def get_available_providers(self) -> list:
        """Retorna lista de proveedores disponibles"""
        return list(self.providers.keys())

    def generate_text(
        self,
        prompt: str,
        provider: AIProvider = None,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """
        Genera texto usando el proveedor especificado.
        Retorna dict con: response, provider, model, success, error
        """
        # Usar proveedor por defecto si no se especifica
        if provider is None:
            provider_str = os.getenv("PIXELART_AI_PROVIDER", "ollama")
            try:
                provider = AIProvider(provider_str)
            except ValueError:
                provider = AIProvider.OLLAMA

        if provider not in self.providers:
            return {
                "response": "",
                "provider": provider.value,
                "model": "",
                "success": False,
                "error": f"Proveedor {provider.value} no configurado",
            }

        config = self.providers[provider]
        model = model or config.default_model

        try:
            if provider == AIProvider.OLLAMA:
                return self._generate_ollama(prompt, config, model)
            else:
                return self._generate_openai_compatible(
                    prompt, config, model, provider, temperature, max_tokens
                )
        except Exception as e:
            return {
                "response": "",
                "provider": provider.value,
                "model": model,
                "success": False,
                "error": str(e),
            }

    def _generate_ollama(
        self, prompt: str, config: ProviderConfig, model: str
    ) -> Dict[str, Any]:
        """Genera texto usando Ollama (API nativa)"""
        url = f"{config.base_url}/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }

        resp = requests.post(url, json=payload, timeout=config.timeout)
        resp.raise_for_status()
        data = resp.json()

        return {
            "response": data.get("response", ""),
            "provider": "ollama",
            "model": model,
            "success": True,
            "error": None,
        }

    def _generate_openai_compatible(
        self,
        prompt: str,
        config: ProviderConfig,
        model: str,
        provider: AIProvider,
        temperature: float,
        max_tokens: int,
    ) -> Dict[str, Any]:
        """Genera texto usando API compatible con OpenAI"""
        url = f"{config.base_url}/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.api_key}",
        }

        # Headers especiales para OpenRouter
        if provider == AIProvider.OPENROUTER:
            headers["HTTP-Referer"] = os.getenv("YOUR_SITE_URL", "https://pixelcv.alexanderoviedofadul.dev")
            headers["X-Title"] = "PixelCV"

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=config.timeout)
        resp.raise_for_status()
        data = resp.json()

        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        return {
            "response": content,
            "provider": provider.value,
            "model": model,
            "success": True,
            "error": None,
        }

    def generate_with_fallback(
        self,
        prompt: str,
        preferred_providers: list = None,
        model: str = None,
    ) -> Dict[str, Any]:
        """
        Genera texto intentando múltiples proveedores en orden hasta que uno funcione.
        """
        if preferred_providers is None:
            preferred_providers = [
                AIProvider.GROQ,      # Muy rápido
                AIProvider.OPENROUTER, # Gratis
                AIProvider.OLLAMA,     # Local
                AIProvider.DEEPSEEK,   # Buen razonamiento
                AIProvider.TOGETHER,   # Buena calidad
            ]

        errors = []
        for provider in preferred_providers:
            if provider not in self.providers:
                continue

            result = self.generate_text(prompt, provider, model)
            if result["success"]:
                return result
            errors.append(f"{provider.value}: {result['error']}")

        return {
            "response": "",
            "provider": "none",
            "model": "",
            "success": False,
            "error": f"Todos los proveedores fallaron: {'; '.join(errors)}",
        }

    def generate_with_three_tier_fallback(
        self,
        prompt: str,
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
    ) -> Dict[str, Any]:
        """
        Fallback de 3 niveles específicos para operaciones de CV:
        1. Groq (llama-3.1-8b-instant) - Muy rápido
        2. DeepSeek (deepseek-chat) - Buen razonamiento
        3. Ollama (phi3.5:latest) - Local fallback

        Retorna dict con: response, provider, model, tier_used, success, error
        """
        tiers = [
            (AIProvider.GROQ, "llama-3.1-8b-instant"),
            (AIProvider.DEEPSEEK, "deepseek-chat"),
            (AIProvider.OLLAMA, "phi3.5:latest"),
        ]

        last_error = None
        for tier_idx, (provider, model) in enumerate(tiers, 1):
            if provider not in self.providers:
                continue

            try:
                # Si hay system_prompt, combinarlo con el prompt
                full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

                result = self.generate_text(
                    prompt=full_prompt,
                    provider=provider,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                if result["success"]:
                    result["tier_used"] = tier_idx
                    return result
                else:
                    last_error = result.get("error", "Unknown error")
                    print(f"[MultiAI] Tier {tier_idx} failed: {provider.value}/{model}: {last_error}")
            except Exception as e:
                last_error = str(e)
                print(f"[MultiAI] Tier {tier_idx} exception: {provider.value}/{model}: {last_error}")

        return {
            "response": "",
            "provider": "none",
            "model": "",
            "tier_used": 0,
            "success": False,
            "error": f"All tiers failed. Last error: {last_error}",
        }


# Instancia global para importar fácilmente
_service = None


def get_multi_ai_service() -> MultiAIService:
    """Obtiene la instancia global del servicio multi-IA"""
    global _service
    if _service is None:
        _service = MultiAIService()
    return _service


def generate_text_multi(
    prompt: str,
    provider: str = None,
    model: str = None,
) -> str:
    """
    Función de conveniencia para generar texto.
    Compatible con la firma de generate_text() en ollama_service.py
    """
    service = get_multi_ai_service()

    if provider:
        try:
            prov = AIProvider(provider)
        except ValueError:
            prov = AIProvider.OLLAMA
    else:
        prov = None

    result = service.generate_text(prompt, prov, model)
    return result["response"] if result["success"] else ""
