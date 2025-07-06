import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Product } from '@/types/pos';

interface VoiceCommandsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onClearCart: () => void;
  onCompleteOrder: () => void;
  isListening: boolean;
  onToggleListening: () => void;
}

interface VoiceCommand {
  phrase: string;
  action: string;
  description: string;
}

const voiceCommands: VoiceCommand[] = [
  { phrase: "add [product name]", action: "add_product", description: "Add product to cart" },
  { phrase: "remove [product name]", action: "remove_product", description: "Remove product from cart" },
  { phrase: "clear cart", action: "clear_cart", description: "Clear all items" },
  { phrase: "checkout", action: "checkout", description: "Complete order" },
  { phrase: "total", action: "show_total", description: "Show order total" },
  { phrase: "help", action: "show_help", description: "Show available commands" },
];

export function VoiceCommands({
  products,
  onAddToCart,
  onClearCart,
  onCompleteOrder,
  isListening,
  onToggleListening
}: VoiceCommandsProps) {
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          processVoiceCommand(finalTranscript.toLowerCase());
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsProcessing(false);
      };

      recognitionInstance.onend = () => {
        console.log('Voice recognition ended');
        setIsProcessing(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const processVoiceCommand = (command: string) => {
    setIsProcessing(true);
    setLastCommand(command);

    // Add product command
    if (command.startsWith('add ')) {
      const productName = command.substring(4).trim();
      const product = products.find(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      );
      
      if (product) {
        onAddToCart(product);
        setTranscript(`Added ${product.name} to cart`);
      } else {
        setTranscript(`Product "${productName}" not found`);
      }
    }
    
    // Remove product command
    else if (command.startsWith('remove ')) {
      const productName = command.substring(7).trim();
      setTranscript(`Remove functionality for "${productName}" - use UI`);
    }
    
    // Clear cart command
    else if (command.includes('clear cart')) {
      onClearCart();
      setTranscript('Cart cleared');
    }
    
    // Checkout command
    else if (command.includes('checkout') || command.includes('complete order')) {
      onCompleteOrder();
      setTranscript('Processing checkout...');
    }
    
    // Show total command
    else if (command.includes('total')) {
      setTranscript('Total displayed on screen');
    }
    
    // Help command
    else if (command.includes('help')) {
      setTranscript('Available commands: add [product], clear cart, checkout, total');
    }
    
    // Unknown command
    else {
      setTranscript(`Unknown command: "${command}". Say "help" for available commands.`);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setTranscript('');
    }, 3000);
  };

  const startListening = () => {
    if (recognition && isSupported) {
      try {
        recognition.start();
        onToggleListening();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      onToggleListening();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Voice commands not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mic className="h-4 w-4 text-blue-600" />
          Voice Commands
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
            <Zap className="h-2 w-2 mr-1" />
            Hands-free
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Voice Control Button */}
        <div className="flex justify-center">
          <Button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`h-16 w-16 rounded-full ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Status Display */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            {isListening ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-600">Listening...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Click to start</span>
              </>
            )}
          </div>
          
          {transcript && (
            <div className="bg-white p-3 rounded-lg border">
              <div className="text-xs text-gray-500 mb-1">Last command:</div>
              <div className="text-sm font-medium">{transcript}</div>
            </div>
          )}
        </div>

        {/* Available Commands */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Available Commands:</div>
          <div className="grid grid-cols-1 gap-1">
            {voiceCommands.map((cmd, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  "{cmd.phrase}"
                </span>
                <span className="text-gray-600">- {cmd.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-100 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Volume2 className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Voice Tips:</div>
              <ul className="space-y-1">
                <li>• Speak clearly and at normal volume</li>
                <li>• Say "add coffee" to add a product</li>
                <li>• Say "checkout" to complete order</li>
                <li>• Say "help" for all commands</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 