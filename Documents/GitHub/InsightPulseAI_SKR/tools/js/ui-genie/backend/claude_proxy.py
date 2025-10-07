import os
import json
from typing import Optional, List, Dict, Any
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up API keys from environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Configure OpenAI API key
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# Load the system prompt from the prompts directory
try:
    with open(os.path.join(os.path.dirname(__file__), "prompts", "ui_genie_prompt.txt"), "r") as f:
        SYSTEM_PROMPT = f.read()
except Exception as e:
    print(f"Could not load system prompt: {str(e)}")
    SYSTEM_PROMPT = """
    You are a professional frontend engineer and UI designer.
    Generate clean, responsive TailwindCSS-based HTML inside a single <div>.
    Use semantic HTML. Avoid <style> or <script> tags. Return ONLY the HTML block.
    
    Focus on clean, modern UI with good spacing, contrast, and readability.
    Ensure the design is responsive and follows best practices.
    Include all Tailwind classes inline in the HTML.
    """

def generate_ui_with_claude(
    prompt_text: str, 
    style: Optional[str] = None, 
    components: Optional[List[str]] = None
) -> str:
    """
    Generate UI code using Claude or a fallback model.
    
    Args:
        prompt_text: The user's UI description
        style: Optional style preference (minimal, modern, colorful, etc.)
        components: Optional list of required components
        
    Returns:
        Generated HTML/CSS code using Tailwind
    """
    # If in mock mode, return sample UI
    if MOCK_MODE:
        return get_mock_ui()
    
    system_prompt = SYSTEM_PROMPT
    
    if style:
        system_prompt += f"\nSTYLE GUIDANCE: Create a UI with a {style} aesthetic."
    
    if components and len(components) > 0:
        components_str = ", ".join(components)
        system_prompt += f"\nREQUIRED COMPONENTS: Please include these components: {components_str}"
    
    try:
        # Fallback to OpenAI
        if OPENAI_API_KEY:
            completion = openai.ChatCompletion.create(
                model="gpt-4",  # or gpt-3.5-turbo
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt_text}
                ],
                temperature=0.7,
                max_tokens=2500
            )
            return completion.choices[0].message.content.strip()
        else:
            # If no API key and not in mock mode
            print("No API key available and not in mock mode")
            return "<div class='text-red-500 p-4 border border-red-200 rounded-lg'>No API key available. Check backend logs.</div>"
    except Exception as e:
        print(f"Error generating UI: {str(e)}")
        return "<div class='text-red-500 p-4 border border-red-200 rounded-lg'>Error generating UI. Check backend logs.</div>"

def get_mock_ui() -> str:
    """Return a pre-generated sample UI for testing purposes"""
    return """
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <div class="text-center">
    <h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
      Pricing Plans
    </h2>
    <p class="mt-4 text-xl text-gray-500">
      Choose the perfect plan for your needs.
    </p>
    
    <!-- Pricing toggle -->
    <div class="relative mt-6 flex justify-center">
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-gray-900">Monthly</span>
        <button type="button" class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600" role="switch" aria-checked="false">
          <span class="sr-only">Use setting</span>
          <span aria-hidden="true" class="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
        </button>
        <span class="text-sm font-medium text-gray-500">Yearly</span>
      </div>
    </div>
  </div>

  <div class="mt-12 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:gap-8">
    <!-- Basic Plan -->
    <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900">Basic</h3>
        <p class="mt-4 text-sm text-gray-500">All the basics for starting a new business</p>
        <p class="mt-8">
          <span class="text-4xl font-extrabold text-gray-900">$12</span>
          <span class="text-base font-medium text-gray-500">/mo</span>
        </p>
        <a href="#" class="mt-8 block w-full bg-blue-50 border border-blue-500 rounded-md py-2 text-sm font-semibold text-blue-600 text-center hover:bg-blue-100">Buy Basic</a>
      </div>
      <div class="pt-6 pb-8 px-6">
        <h4 class="text-sm font-medium text-gray-900 tracking-wide">What's included</h4>
        <ul class="mt-6 space-y-4">
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">5 products</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Basic analytics</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">48-hour support response time</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Pro Plan -->
    <div class="border border-blue-500 rounded-lg shadow-sm divide-y divide-gray-200">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900">Pro</h3>
        <p class="mt-4 text-sm text-gray-500">Professional features for growing businesses</p>
        <p class="mt-8">
          <span class="text-4xl font-extrabold text-gray-900">$24</span>
          <span class="text-base font-medium text-gray-500">/mo</span>
        </p>
        <a href="#" class="mt-8 block w-full bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700">Buy Pro</a>
      </div>
      <div class="pt-6 pb-8 px-6">
        <h4 class="text-sm font-medium text-gray-900 tracking-wide">What's included</h4>
        <ul class="mt-6 space-y-4">
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">25 products</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Advanced analytics</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">24-hour support response time</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Marketing automations</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Enterprise Plan -->
    <div class="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
      <div class="p-6">
        <h3 class="text-lg font-medium text-gray-900">Enterprise</h3>
        <p class="mt-4 text-sm text-gray-500">Custom solutions for large organizations</p>
        <p class="mt-8">
          <span class="text-4xl font-extrabold text-gray-900">$48</span>
          <span class="text-base font-medium text-gray-500">/mo</span>
        </p>
        <a href="#" class="mt-8 block w-full bg-blue-50 border border-blue-500 rounded-md py-2 text-sm font-semibold text-blue-600 text-center hover:bg-blue-100">Buy Enterprise</a>
      </div>
      <div class="pt-6 pb-8 px-6">
        <h4 class="text-sm font-medium text-gray-900 tracking-wide">What's included</h4>
        <ul class="mt-6 space-y-4">
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Unlimited products</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Custom analytics</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">1-hour support response time</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Marketing automations</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">API access</span>
          </li>
          <li class="flex space-x-3">
            <svg class="flex-shrink-0 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm text-gray-500">Dedicated account manager</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>
    """