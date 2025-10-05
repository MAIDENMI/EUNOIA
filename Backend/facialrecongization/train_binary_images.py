"""
Binary Emotion Recognition: Happy vs Sad
Trains from image folders instead of CSV
"""

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import matplotlib.pyplot as plt
import os

# Paths
TRAIN_DIR = 'fer2013.csv/train'
TEST_DIR = 'fer2013.csv/test'

# Only use happy and sad
EMOTIONS_TO_USE = ['happy', 'sad']

def create_data_generators(batch_size=64):
    """
    Create data generators for happy and sad only
    """
    # Training data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        shear_range=0.1
    )
    
    # Test data (no augmentation)
    test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Load training data
    train_generator = train_datagen.flow_from_directory(
        TRAIN_DIR,
        target_size=(48, 48),
        batch_size=batch_size,
        color_mode='grayscale',
        classes=EMOTIONS_TO_USE,
        class_mode='categorical',
        shuffle=True
    )
    
    # Load test data
    test_generator = test_datagen.flow_from_directory(
        TEST_DIR,
        target_size=(48, 48),
        batch_size=batch_size,
        color_mode='grayscale',
        classes=EMOTIONS_TO_USE,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, test_generator

def create_binary_model(input_shape=(48, 48, 1)):
    """
    Create CNN for binary classification (happy vs sad)
    """
    model = models.Sequential([
        # Block 1
        layers.Conv2D(64, (3, 3), activation='relu', padding='same', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 2
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 3
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Block 4
        layers.Conv2D(512, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(512, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Dense layers
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(2, activation='softmax')  # Binary: sad=0, happy=1
    ])
    
    return model

def train_model(epochs=50, batch_size=64):
    """
    Train the binary emotion recognition model
    """
    print("=" * 70)
    print("Binary Emotion Recognition Training (Happy vs Sad)")
    print("=" * 70)
    
    # Create data generators
    print("\nLoading data from image folders...")
    train_gen, test_gen = create_data_generators(batch_size)
    
    print(f"\nTraining samples: {train_gen.samples}")
    print(f"Testing samples: {test_gen.samples}")
    print(f"Class indices: {train_gen.class_indices}")
    
    # Create model
    model = create_binary_model()
    
    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\nModel Architecture:")
    model.summary()
    
    # Callbacks
    callbacks = [
        EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            mode='max'
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7
        ),
        ModelCheckpoint(
            'emotion_binary_best.h5',
            monitor='val_accuracy',
            save_best_only=True,
            mode='max'
        )
    ]
    
    # Train
    print("\nStarting training...")
    print("=" * 70)
    
    history = model.fit(
        train_gen,
        steps_per_epoch=train_gen.samples // batch_size,
        validation_data=test_gen,
        validation_steps=test_gen.samples // batch_size,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n" + "=" * 70)
    print("Evaluating model...")
    test_loss, test_acc = model.evaluate(test_gen, verbose=0)
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Test loss: {test_loss:.4f}")
    
    # Save final model
    model.save('emotion_binary_final.h5')
    print("\nModel saved as 'emotion_binary_final.h5'")
    print("Best model saved as 'emotion_binary_best.h5'")
    
    # Plot training history
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title('Model Accuracy (Happy vs Sad)')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.grid(True)
    
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Model Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig('training_history_binary.png', dpi=150)
    print("Training history saved as 'training_history_binary.png'")
    
    print("\n" + "=" * 70)
    print("Training Complete!")
    print("=" * 70)
    
    return model, history

if __name__ == "__main__":
    if not os.path.exists(TRAIN_DIR):
        print(f"ERROR: Training directory not found: {TRAIN_DIR}")
        print("Please ensure fer2013.csv/train/ exists with happy and sad folders")
    elif not os.path.exists(TEST_DIR):
        print(f"ERROR: Test directory not found: {TEST_DIR}")
        print("Please ensure fer2013.csv/test/ exists with happy and sad folders")
    else:
        model, history = train_model(epochs=50, batch_size=64)
